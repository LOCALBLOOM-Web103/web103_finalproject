import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import passport from 'passport'
import { pool } from './config/database.js'
import authRouter from './routes/auth.js'
import eventsRouter from './routes/events.js'
import lookupsRouter from './routes/lookups.js'
import { requireAuth } from './middleware/auth.js'
import { resetDemoData } from './config/reset.js'

// express-session only warns without a secret, so fail loudly instead
if (!process.env.SESSION_SECRET)
  throw new Error('SESSION_SECRET is missing from .env')

const app = express()
// Render sits behind a proxy; without this, secure cookies are never set
app.set('trust proxy', 1)
app.use(express.json())

// Sessions live in Postgres so logins survive Render restarts
const PgSession = connectPgSimple(session)
app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  }),
)
app.use(passport.initialize())
app.use(passport.session())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/auth', authRouter)
app.use('/api/events', eventsRouter)
app.use('/api', lookupsRouter)

// Custom non-RESTful action: put the demo events/venues/tags back to their seeded state
app.post('/api/reset', requireAuth, async (req, res) => {
  try {
    await resetDemoData(pool)
    res.json({ status: 'reset' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`),
)
