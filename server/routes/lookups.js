import express from 'express'
import { pool } from '../config/database.js'

const router = express.Router()

// Options for the dashboard filter dropdowns
router.get('/activity-types', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM activity_types ORDER BY name')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/tags', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM tags ORDER BY name')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/venues', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, city FROM venues ORDER BY name')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
