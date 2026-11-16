// Smoke tests: read-only checks that every page and public API route responds.
// Never logs in and never writes, so it is safe to run against the live site.
//
//   BASE_URL=https://<your-app>.onrender.com npm run smoke
//   npm run smoke            (defaults to http://localhost:3001)
import test from 'node:test'
import assert from 'node:assert/strict'

const BASE = (process.env.BASE_URL || 'http://localhost:3001').replace(
  /\/$/,
  '',
)
// Render's free tier sleeps; the first request can take a while to wake it
const TIMEOUT = 60_000

const get = (path) =>
  fetch(BASE + path, {
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT),
  })

// First event id, so the detail and edit pages are tested with a real id
let eventId

test('API: health check', async () => {
  const res = await get('/api/health')
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { status: 'ok' })
})

test('API: events list returns events with the fields the home page uses', async () => {
  const res = await get('/api/events')
  assert.equal(res.status, 200)
  const events = await res.json()
  assert.ok(Array.isArray(events), 'expected an array')
  assert.ok(events.length > 0, 'expected at least one event')
  for (const key of [
    'id',
    'title',
    'activity_type',
    'price',
    'images',
    'venue_name',
  ])
    assert.ok(key in events[0], `event is missing "${key}"`)
  eventId = events[0].id
})

test('API: single event', async () => {
  assert.ok(eventId, 'needs the events test to pass first')
  const res = await get(`/api/events/${eventId}`)
  assert.equal(res.status, 200)
  assert.equal((await res.json()).id, eventId)
})

for (const path of ['/api/activity-types', '/api/tags', '/api/venues']) {
  test(`API: ${path} returns a list`, async () => {
    const res = await get(path)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(await res.json()))
  })
}

test('API: filters work', async () => {
  const res = await get('/api/events?tier=free')
  assert.equal(res.status, 200)
  for (const event of await res.json()) assert.equal(Number(event.price), 0)
})

test('API: unknown event is a 404 and a bad id is a 400', async () => {
  assert.equal((await get('/api/events/999999999')).status, 404)
  assert.equal((await get('/api/events/abc')).status, 400)
})

test('API: unknown API path is a JSON 404, not the React page', async () => {
  const res = await get('/api/nope')
  assert.equal(res.status, 404)
  assert.match(res.headers.get('content-type'), /json/)
})

// Logged out, these must refuse rather than crash or leak data
for (const path of ['/api/profile', '/api/venues/mine']) {
  test(`API: ${path} requires login`, async () => {
    assert.equal((await get(path)).status, 401)
  })
}

test('Auth: /auth/me is null when logged out', async () => {
  const res = await get('/auth/me')
  assert.equal(res.status, 200)
  assert.equal(await res.json(), null)
})

test('Auth: /auth/github redirects to GitHub', async () => {
  const res = await get('/auth/github')
  assert.ok([301, 302].includes(res.status), `got ${res.status}`)
  assert.match(res.headers.get('location'), /github\.com/)
})

// Every page is a React Router route, so each should return the app shell (index.html).
// Pages behind login redirect in the browser, so the server still serves the shell.
const PAGES = [
  '/',
  '/?tier=free',
  '/events/new',
  '/events/1',
  '/events/1/edit',
  '/venues',
  '/venues/new',
  '/venues/1/edit',
  '/profile',
  '/my-events',
  '/page-that-does-not-exist',
]

for (const path of PAGES) {
  test(`Page: ${path} serves the app`, async () => {
    const res = await get(path)
    assert.equal(res.status, 200)
    assert.match(res.headers.get('content-type'), /html/)
    const html = await res.text()
    assert.match(html, /<div id="root">/)
    assert.match(html, /Local Bloom/)
  })
}

test('Page: the JS and CSS the shell links to actually load', async () => {
  const html = await (await get('/')).text()
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(
    (m) => m[1],
  )
  assert.ok(
    assets.length >= 2,
    'expected built JS and CSS links (run npm run build in client/)',
  )
  for (const asset of assets) {
    const res = await get(asset)
    assert.equal(res.status, 200, `${asset} returned ${res.status}`)
  }
})
