import express from 'express'
import { pool } from '../config/database.js'

const router = express.Router()

const eventQuery = `
  SELECT e.*,
    v.name AS venue_name, v.address, v.city, v.hours, v.website_url, v.latitude, v.longitude,
    a.name AS activity_type,
    COALESCE(array_agg(t.name ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL), '{}') AS tags,
    ARRAY(SELECT url FROM event_images WHERE event_id = e.id ORDER BY position) AS images
  FROM events e
  JOIN venues v ON v.id = e.venue_id
  JOIN activity_types a ON a.id = e.activity_type_id
  LEFT JOIN event_tags et ON et.event_id = e.id
  LEFT JOIN tags t ON t.id = et.tag_id
`

// Keep in sync with priceTier() in client/src/format.js
const tierRanges = {
  free: 'e.price = 0',
  '$': 'e.price > 0 AND e.price < 25',
  '$$': 'e.price >= 25 AND e.price < 60',
  '$$$': 'e.price >= 60'
}

// GET /api/events?activity_type=Workshop&tier=$$&tag=pottery (all optional, combined with AND)
router.get('/', async (req, res) => {
  const { activity_type, tier, tag } = req.query
  const where = []
  const params = []

  if (tier !== undefined) {
    if (!tierRanges[tier]) return res.status(400).json({ error: 'tier must be one of: free, $, $$, $$$' })
    where.push(tierRanges[tier])
  }
  if (activity_type) {
    params.push(activity_type)
    where.push(`a.name = $${params.length}`)
  }
  if (tag) {
    // Subquery so the matching event still returns all of its tags, not just the filtered one
    params.push(tag)
    where.push(`e.id IN (SELECT et2.event_id FROM event_tags et2 JOIN tags t2 ON t2.id = et2.tag_id WHERE t2.name = $${params.length})`)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  try {
    const { rows } = await pool.query(`${eventQuery} ${whereSql} GROUP BY e.id, v.id, a.id ORDER BY e.start_time`, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Event id must be an integer' })

  try {
    const { rows } = await pool.query(`${eventQuery} WHERE e.id = $1 GROUP BY e.id, v.id, a.id`, [id])
    if (!rows.length) return res.status(404).json({ error: 'Event not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Basic checks only; stricter validation (URLs, address format) is a separate issue
function validateEvent(body) {
  const { venue_id, activity_type_id, title, start_time, end_time, price = 0, tag_ids = [] } = body
  if (!Number.isInteger(venue_id)) return 'venue_id must be an integer'
  if (!Number.isInteger(activity_type_id)) return 'activity_type_id must be an integer'
  if (typeof title !== 'string' || !title.trim()) return 'title is required'
  const start = Date.parse(start_time)
  const end = Date.parse(end_time)
  if (Number.isNaN(start) || Number.isNaN(end)) return 'start_time and end_time must be valid dates'
  if (end <= start) return 'end_time must be after start_time'
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) return 'price must be a number >= 0'
  if (!Array.isArray(tag_ids) || !tag_ids.every(Number.isInteger)) return 'tag_ids must be an array of integers'
  return null
}

// POST /api/events  body: { venue_id, activity_type_id, title, description, what_to_bring, start_time, end_time, price, tag_ids: [1, 2] }
router.post('/', async (req, res) => {
  const error = validateEvent(req.body ?? {})
  if (error) return res.status(400).json({ error })

  const { venue_id, activity_type_id, title, description = null, what_to_bring = null, start_time, end_time, price = 0, tag_ids = [] } = req.body
  const client = await pool.connect()

  try {
    // Event row and its tag links succeed or fail together
    await client.query('BEGIN')
    const { rows: [{ id }] } = await client.query(
      `INSERT INTO events (venue_id, activity_type_id, title, description, what_to_bring, start_time, end_time, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [venue_id, activity_type_id, title.trim(), description, what_to_bring, start_time, end_time, price]
    )
    await client.query(
      'INSERT INTO event_tags (event_id, tag_id) SELECT $1, unnest($2::int[])',
      [id, [...new Set(tag_ids)]]
    )
    await client.query('COMMIT')

    const { rows } = await pool.query(`${eventQuery} WHERE e.id = $1 GROUP BY e.id, v.id, a.id`, [id])
    res.status(201).json(rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    // 23503 = foreign key violation: venue, activity type, or tag id doesn't exist
    if (err.code === '23503') return res.status(400).json({ error: `Unknown reference: ${err.detail}` })
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

export default router
