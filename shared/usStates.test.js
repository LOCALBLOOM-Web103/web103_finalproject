// Run: node --test shared/usStates.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { US_STATES, isUsState, isZipCode } from './usStates.js'

test('50 states plus DC, no duplicate codes', () => {
  const codes = US_STATES.map(([code]) => code)
  assert.equal(codes.length, 51)
  assert.equal(new Set(codes).size, 51)
  assert.ok(codes.includes('DC'))
})

test('isUsState matches exact codes only', () => {
  assert.equal(isUsState('CA'), true)
  assert.equal(isUsState('ca'), false) // callers uppercase if they want to
  assert.equal(isUsState('XX'), false)
  assert.equal(isUsState(''), false)
  assert.equal(isUsState(undefined), false)
})

test('isZipCode accepts 5 digits or ZIP+4', () => {
  assert.equal(isZipCode('94110'), true)
  assert.equal(isZipCode('94110-1234'), true)
  assert.equal(isZipCode('9411'), false)
  assert.equal(isZipCode('94110-12'), false)
})
