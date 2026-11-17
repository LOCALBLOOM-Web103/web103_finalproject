import express from 'express'
import { createHash } from 'node:crypto'
import { requireAuth } from '../middleware/auth.js'

// Cloudinary's signing rule: sort params by key, join as key=value with &,
// append the API secret, SHA-1 hex. https://cloudinary.com/documentation/authentication_signatures
export function signUpload(params, secret) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return createHash('sha1')
    .update(toSign + secret)
    .digest('hex')
}

const router = express.Router()

// POST /api/uploads/signature  custom non-RESTful action
// The browser uploads the file straight to Cloudinary with this one-time signature,
// so the API secret never leaves the server and only logged-in users can upload.
router.post('/signature', requireAuth, (req, res) => {
  const {
    CLOUDINARY_CLOUD_NAME: cloudName,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: secret,
  } = process.env
  if (!cloudName || !apiKey || !secret)
    return res.status(503).json({ error: 'Image uploads are not configured' })

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'localbloom'
  res.json({
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature: signUpload({ folder, timestamp }, secret),
  })
})

export default router
