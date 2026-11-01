import express from 'express'
import eventsRouter from './routes/events.js'

const app = express()
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/events', eventsRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`))
