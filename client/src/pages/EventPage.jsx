import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatDate } from '../format.js'
import { useAuth } from '../AuthContext.jsx'
import Loading from '../components/Loading.jsx'

// Poster border colors: the dashboard tile palette. Old Lace is left out because it would
// disappear against the page's cream background.
const FRAME_COLORS = ['#fe6d73', '#ffcb77', '#24e5d2', '#2584a7']

// Picks a color that looks random but stays the same for a given event (same id, same color)
const frameColorFor = (id) =>
  FRAME_COLORS[(Math.imul(Number(id), 2654435761) >>> 0) % FRAME_COLORS.length]

// Shared attributes for the line icons next to the event facts
const ICON = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function EventPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${event.title}"? This can't be undone.`))
      return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
      // 404 means it's already gone, which is the outcome the user wanted
      if (!res.ok && res.status !== 404)
        throw new Error(`Delete failed (${res.status})`)
      navigate('/')
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(
              new Error(
                res.status === 404
                  ? 'Event not found'
                  : `Request failed (${res.status})`,
              ),
            ),
      )
      .then(setEvent)
      .catch((err) => setError(err.message))
  }, [id])

  if (error)
    return (
      <p className="status">
        {error}. <Link to="/">Back to events</Link>
      </p>
    )
  if (!event) return <Loading label="Loading event…" />

  const price = Number(event.price)
  // Only the creator sees Edit/Delete; the server enforces the same rule with a 403
  const isOwner = user?.id === event.created_by

  return (
    <article className="event-page event-layout">
      <div className="event-page-top">
        <Link to="/" className="back">
          ← All events
        </Link>
        {isOwner && (
          <div className="event-actions">
            <Link to={`/events/${id}/edit`} className="secondary-button">
              Edit
            </Link>
            <button
              type="button"
              className="secondary-button danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>
      {deleteError && (
        <p className="form-error" role="alert">
          {deleteError}
        </p>
      )}
      <div className={`event-body${event.images[0] ? ' has-poster' : ''}`}>
        {event.images[0] && (
          <div
            className="hero-frame"
            style={{ '--frame-color': frameColorFor(id) }}
          >
            {/* Poster-shaped box: the picture fits inside it whole, and a blurred copy fills the rest */}
            <div className="poster">
              <img
                className="poster-bg"
                src={event.images[0]}
                alt=""
                aria-hidden="true"
              />
              <img className="poster-img" src={event.images[0]} alt="" />
            </div>
          </div>
        )}

        <div className="event-info">
          <h1>{event.title}</h1>
          <span className="pill">{event.activity_type}</span>
          <ul className="tags">
            {event.tags.map((tag) => (
              <li key={tag}>#{tag}</li>
            ))}
          </ul>

          <p className="price">
            {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
          </p>

          {/* Icons stand in for the labels; the visually hidden text keeps them readable by screen readers */}
          <ul className="facts">
            <li>
              <svg {...ICON} aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
              <span className="sr-only">When: </span>
              <span>
                {formatDate(event.start_time)} – {formatDate(event.end_time)}
              </span>
            </li>
            <li>
              <svg {...ICON} aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              <span className="sr-only">Where: </span>
              <span>
                {event.venue_name}
                <br />
                {event.address}, {event.city}
              </span>
            </li>
            {event.hours && (
              <li>
                <svg {...ICON} aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span className="sr-only">Venue hours: </span>
                <span>{event.hours}</span>
              </li>
            )}
          </ul>

          <h2>What you'll do</h2>
          <p>{event.description}</p>
          <h2>What to bring</h2>
          <p>{event.what_to_bring}</p>
          {((event.latitude != null && event.longitude != null) ||
            (event.address && event.city)) && (
            <a
              className="button"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.latitude},${event.longitude}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Maps
            </a>
          )}
          {event.website_url && (
            <a
              className="button"
              href={event.website_url}
              target="_blank"
              rel="noreferrer"
            >
              Visit venue website
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export default EventPage
