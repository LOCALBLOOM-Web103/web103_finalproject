import express from 'express'
import eventsRouter from './routes/events.js'
import lookupsRouter from './routes/lookups.js'

const app = express()
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/events', eventsRouter)
app.use('/api', lookupsRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`))
