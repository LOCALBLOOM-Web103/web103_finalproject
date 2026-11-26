// Run: node --test server/routes/events.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeEventPatch, newVenueValues, validateEvent } from './events.js'
import { validateVenue } from './lookups.js'

// Shaped like a row from `SELECT * FROM events` (pg returns NUMERIC as a string, TIMESTAMP as a Date)
const existing = {
  id: 1,
  venue_id: 1,
  activity_type_id: 1,
  title: 'Intro to Wheel Throwing',
  description: null,
  what_to_bring: null,
  start_time: new Date('2026-12-01T18:00'),
  end_time: new Date('2026-12-01T20:00'),
  price: '45.00',
  created_by: 1,
}

test('PATCH with only a title keeps every other field and passes validation', () => {
  const merged = mergeEventPatch(existing, { title: 'Wheel Throwing 101' })
  assert.equal(merged.title, 'Wheel Throwing 101')
  assert.equal(merged.price, 45)
  assert.equal(merged.venue_id, 1)
  assert.equal(validateEvent(merged), null)
})

test('PATCH end_time before the stored start_time is rejected', () => {
  const merged = mergeEventPatch(existing, { end_time: '2026-12-01T17:00' })
  assert.equal(validateEvent(merged), 'end_time must be after start_time')
})

test('PATCH with a bad field is rejected', () => {
  assert.equal(
    validateEvent(mergeEventPatch(existing, { price: -5 })),
    'price must be a number >= 0',
  )
  assert.equal(
    validateEvent(mergeEventPatch(existing, { title: '  ' })),
    'title is required',
  )
})

const event = {
  activity_type_id: 1,
  title: 'Wheel Throwing 101',
  start_time: '2026-12-01T18:00',
  end_time: '2026-12-01T20:00',
}
const venue = {
  name: 'Clay & Coffee Studio',
  address: '412 Valencia St',
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94110',
}

// [venue, null if valid, else the field the message must name]
const cases = [
  [venue, null],
  [{ ...venue, latitude: '37.7', longitude: '-122.4' }, null],
  [{ ...venue, latitude: 37.7, longitude: -122.4 }, null],
  [{ ...venue, latitude: '', longitude: '' }, null],
  [{ ...venue, website_url: '' }, null],
  [{ ...venue, website_url: 'https://localhost:3000' }, null],
  [{ ...venue, website_url: 'ftp://x.com' }, 'website_url'],
  [{ ...venue, website_url: 'not a url' }, 'website_url'],
  [{ ...venue, latitude: 37.7 }, 'Provide both latitude and longitude'],
  [{ ...venue, latitude: 1, longitude: 'east' }, 'longitude'],
  [{ ...venue, name: 'x'.repeat(121) }, 'name'],
  [{ ...venue, city: '  ' }, 'city'],
  [{ ...venue, state: 'ZZ' }, 'state'],
  [{ ...venue, zip_code: '9411' }, 'zip_code'],
]

test('POST /api/venues and an inline new_venue give the same answer', () => {
  for (const [v, field] of cases) {
    const label = JSON.stringify(v)
    const venueError = validateVenue(v)
    const eventError = validateEvent({ ...event, new_venue: v })
    if (field === null) {
      assert.equal(venueError, null, label)
      assert.equal(eventError, null, label)
    } else {
      assert.match(venueError, new RegExp(`^${field}`), label)
      assert.equal(eventError, `New venue: ${venueError}`, label)
    }
  }
})

test('an inline new_venue needs a state, since it goes into the address', () => {
  for (const state of [undefined, null, ''])
    assert.match(
      validateEvent({ ...event, new_venue: { ...venue, state } }),
      /^New venue: state /,
    )
})

// Column order: name, address, city, latitude, longitude, website_url, hours
test('an inline new_venue is saved trimmed, with state and ZIP in the address', () => {
  assert.deepEqual(
    newVenueValues({
      name: ' Clay & Coffee Studio ',
      address: ' 412 Valencia St ',
      city: 'San Francisco',
      state: 'CA',
      zip_code: ' 94110 ',
      latitude: '37.7652',
      longitude: '-122.4219',
      website_url: '  https://example.com  ',
    }),
    [
      'Clay & Coffee Studio',
      '412 Valencia St, CA 94110',
      'San Francisco',
      37.7652,
      -122.4219,
      'https://example.com',
      null,
    ],
  )
})

test('blank inline new_venue fields are saved as null, not empty strings', () => {
  assert.deepEqual(
    newVenueValues({
      name: 'Clay & Coffee Studio',
      address: '412 Valencia St',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '',
      latitude: '',
      longitude: '',
      website_url: '',
    }),
    [
      'Clay & Coffee Studio',
      '412 Valencia St, CA',
      'San Francisco',
      null,
      null,
      null,
      null,
    ],
  )
})
