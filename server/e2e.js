// End-to-end test for the venue rules: real routes, real HTTP, real database.
// ⚠️ Writes to the database in DATABASE_URL. Everything it creates belongs to a throwaway
// user that is deleted at the end (ON DELETE CASCADE removes its venues and events).
//
//   npm run e2e        (from server/)
//
// Login is GitHub OAuth, so instead of signing in, a tiny middleware sets req.user to the
// throwaway user, the way Passport would after login.
import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { pool } from './config/database.js'
import eventsRouter from './routes/events.js'
import lookupsRouter from './routes/lookups.js'

const tag = `e2e-${Date.now()}`
let user, server, base, activityTypeId

before(async () => {
  ;({
    rows: [user],
  } = await pool.query(
    'INSERT INTO users (username, name) VALUES ($1, $1) RETURNING id',
    [tag],
  ))
  ;({
    rows: [{ id: activityTypeId }],
  } = await pool.query('SELECT id FROM activity_types ORDER BY id LIMIT 1'))

  const app = express()
  app.use(express.json())
  app.use((req, res, next) => {
    req.user = { id: user.id }
    next()
  })
  app.use('/api/events', eventsRouter)
  app.use('/api', lookupsRouter)
  server = app.listen(0)
  base = `http://localhost:${server.address().port}`
})

after(async () => {
  server?.close()
  if (user) {
    await pool.query('DELETE FROM users WHERE id = $1', [user.id])
    const { rows } = await pool.query(
      `SELECT (SELECT COUNT(*) FROM venues WHERE owner_id = $1)::int AS venues,
              (SELECT COUNT(*) FROM events WHERE created_by = $1)::int AS events`,
      [user.id],
    )
    assert.deepEqual(rows[0], { venues: 0, events: 0 }, 'cleanup left rows')
  }
  await pool.end()
})

const send = async (method, path, body) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json() }
}

let n = 0
// Unique per call, so resolveVenueId's de-duplication never matches another venue
const venue = (overrides = {}) => ({
  name: `${tag} venue ${++n}`,
  address: '412 Valencia St',
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94110',
  ...overrides,
})
const event = (new_venue) => ({
  activity_type_id: activityTypeId,
  title: `${tag} event`,
  start_time: '2027-01-15T18:00',
  end_time: '2027-01-15T20:00',
  new_venue,
})

test('both routes accept the same venue and store it the same way', async () => {
  const same = {
    latitude: '37.7652',
    longitude: '-122.4219',
    website_url: '  https://example.com  ',
  }

  const added = await send('POST', '/api/venues', venue(same))
  assert.equal(added.status, 201, JSON.stringify(added.body))

  const posted = await send('POST', '/api/events', event(venue(same)))
  assert.equal(posted.status, 201, JSON.stringify(posted.body))

  const inline = await pool.query('SELECT * FROM venues WHERE id = $1', [
    posted.body.venue_id,
  ])
  const stored = inline.rows[0]
  assert.equal(stored.owner_id, user.id)
  assert.equal(stored.address, '412 Valencia St, CA 94110')
  for (const row of [added.body, stored]) {
    assert.equal(Number(row.latitude), 37.7652)
    assert.equal(Number(row.longitude), -122.4219)
    assert.equal(row.website_url, 'https://example.com')
  }
})

test('an inline venue with blank coordinates saves without them', async () => {
  const res = await send(
    'POST',
    '/api/events',
    event(venue({ latitude: '', longitude: '', website_url: '' })),
  )
  assert.equal(res.status, 201, JSON.stringify(res.body))
  assert.equal(res.body.latitude, null)
  assert.equal(res.body.website_url, null)
})

test('both routes reject the same bad venue with the same field message', async () => {
  for (const bad of [
    { website_url: 'not a url' },
    { website_url: 'ftp://x.com' },
    { latitude: 37.7 },
    { name: 'x'.repeat(121) },
    { state: 'ZZ' },
    { zip_code: '9411' },
  ]) {
    const v = venue(bad)
    const viaVenues = await send('POST', '/api/venues', v)
    const viaEvents = await send('POST', '/api/events', event(v))
    const label = JSON.stringify(bad)
    assert.equal(viaVenues.status, 400, label)
    assert.equal(viaEvents.status, 400, label)
    assert.equal(viaEvents.body.error, `New venue: ${viaVenues.body.error}`)
  }
})

test('an inline venue without a state is rejected by name', async () => {
  const res = await send('POST', '/api/events', event(venue({ state: '' })))
  assert.equal(res.status, 400)
  assert.equal(res.body.error, 'New venue: state is required')
})

test('PATCH runs the same venue check', async () => {
  const posted = await send('POST', '/api/events', event(venue()))
  assert.equal(posted.status, 201, JSON.stringify(posted.body))

  const res = await send('PATCH', `/api/events/${posted.body.id}`, {
    new_venue: venue({ zip_code: '9411' }),
  })
  assert.equal(res.status, 400)
  assert.equal(
    res.body.error,
    'New venue: zip_code must be 5 digits or ZIP+4 (like 94110 or 94110-1234)',
  )
})
