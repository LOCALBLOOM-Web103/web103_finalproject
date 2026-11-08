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

export default router
