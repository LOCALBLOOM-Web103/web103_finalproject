// Run: node --test server/routes/uploads.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { signUpload } from './uploads.js'

test('signUpload matches the worked example in Cloudinary docs', () => {
  const params = {
    timestamp: 1315060510,
    public_id: 'sample_image',
    eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop',
  }
  assert.equal(
    signUpload(params, 'abcd'),
    'bfd09f95f331f558cbd1320e67aa8d488770583e',
  )
})

test('param order does not change the signature', () => {
  assert.equal(
    signUpload({ folder: 'localbloom', timestamp: 1 }, 's'),
    signUpload({ timestamp: 1, folder: 'localbloom' }, 's'),
  )
})
