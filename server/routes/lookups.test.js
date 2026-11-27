// Run: node --test server/routes/lookups.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { validateVenue, validateGeocodeQuery } from './lookups.js'

const valid = {
  name: 'Clay & Coffee Studio',
  address: '412 Valencia St',
  city: 'San Francisco',
  latitude: 37.7652,
  longitude: -122.4219,
  website_url: 'https://example.com',
  hours: 'Tue–Sun 10am–8pm',
}

test('a complete venue passes', () => {
  assert.equal(validateVenue(valid), null)
})

test('only name, address and city are required', () => {
  assert.equal(validateVenue({ name: 'A', address: 'B', city: 'C' }), null)
  assert.equal(validateVenue({ ...valid, name: '  ' }), 'name is required')
  assert.equal(validateVenue({ ...valid, city: undefined }), 'city is required')
  assert.equal(validateVenue(null), 'Venue details are required')
})

test('coordinates must come as an in-range pair', () => {
  assert.equal(
    validateVenue({ ...valid, longitude: '' }),
    'Provide both latitude and longitude, or neither',
  )
  assert.equal(
    validateVenue({ ...valid, latitude: 95 }),
    'latitude must be a number between -90 and 90',
  )
  assert.equal(
    validateVenue({ ...valid, longitude: 'east' }),
    'longitude must be a number between -180 and 180',
  )
  assert.equal(
    validateVenue({ ...valid, latitude: '37.7', longitude: '-122.4' }),
    null,
  )
})

test('website must be an http(s) URL', () => {
  assert.equal(
    validateVenue({ ...valid, website_url: 'ftp://x.com' }),
    'website_url must start with https:// or http://',
  )
  assert.equal(
    validateVenue({ ...valid, website_url: 'not a url' }),
    'website_url must be a valid URL',
  )
  assert.equal(validateVenue({ ...valid, website_url: '' }), null)
})

test('overlong fields are rejected', () => {
  assert.equal(
    validateVenue({ ...valid, name: 'x'.repeat(121) }),
    'name must be 120 characters or fewer',
  )
})

test('state is optional but must be a US state code when sent', () => {
  assert.equal(validateVenue({ ...valid, state: 'CA' }), null)
  assert.equal(validateVenue({ ...valid, state: '' }), null)
  for (const state of ['ZZ', 'ca', 7])
    assert.match(validateVenue({ ...valid, state }), /^state /)
})

test('zip_code is optional but must be 5 digits or ZIP+4 when sent', () => {
  for (const zip_code of ['94110', '94110-1234', ' 94110 ', ''])
    assert.equal(validateVenue({ ...valid, zip_code }), null, zip_code)
  for (const zip_code of ['9411', '94110-12', 'abcde', 94110])
    assert.match(validateVenue({ ...valid, zip_code }), /^zip_code /)
})

const geo = { address: '412 Valencia St', city: 'San Francisco', state: 'CA' }
const STATE_MSG = 'state must be a US state code like CA'
const ZIP_MSG = 'zip_code must be 5 digits or ZIP+4 (like 94110 or 94110-1234)'

test('a valid geocode query passes', () => {
  for (const extra of [
    {},
    { state: 'ca' },
    { zip_code: '' },
    { zip_code: '94110' },
    { zip_code: '94110-1234' },
  ])
    assert.equal(validateGeocodeQuery({ ...geo, ...extra }), null)
})

test('geocode names a missing or too-long address or city', () => {
  const cases = [
    [{ address: '' }, 'address is required'],
    [{ address: 'x'.repeat(201) }, 'address must be 200 characters or fewer'],
    [{ city: '  ' }, 'city is required'],
    [{ city: 'x'.repeat(101) }, 'city must be 100 characters or fewer'],
  ]
  for (const [change, message] of cases)
    assert.equal(validateGeocodeQuery({ ...geo, ...change }), message)
})

test('geocode names the state when only the state is wrong', () => {
  assert.equal(validateGeocodeQuery({ ...geo, state: '' }), 'state is required')
  assert.equal(
    validateGeocodeQuery({ ...geo, state: 'ZZ', zip_code: '94110' }),
    STATE_MSG,
  )
})

test('geocode names the ZIP when only the ZIP is wrong', () => {
  assert.equal(validateGeocodeQuery({ ...geo, zip_code: '9411' }), ZIP_MSG)
})

test('geocode reports the state first when state and ZIP are both wrong', () => {
  assert.equal(
    validateGeocodeQuery({ ...geo, state: 'ZZ', zip_code: '9411' }),
    STATE_MSG,
  )
})
