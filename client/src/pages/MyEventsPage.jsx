import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatShortDate } from '../format.js'

// Container + view for /my-events (wrapped in RequireAuth in App.jsx): the events you posted
function MyEventsPage() {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error(`Request failed (${res.status})`)),
      )
      .then((profile) => setEvents(profile.events))
      .catch((err) => setError(err.message))
  }, [])

  async function deleteEvent(event) {
    if (!window.confirm(`Delete "${event.title}"? This can't be undone.`))
      return
    setDeletingId(event.id)
    setError(null)
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' })
      // 404 means it's already gone, which is the outcome the user wanted
      if (!res.ok && res.status !== 404)
        throw new Error(`Delete failed (${res.status})`)
      setEvents((current) => current.filter((e) => e.id !== event.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (!events && !error) return <p className="status">Loading events…</p>

  return (
    <section className="venues-page">
      <div className="venues-header">
        <h1>My events</h1>
        <Link to="/events/new" className="button">
          + Post event
        </Link>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {events &&
        (events.length === 0 ? (
          <p>You haven't posted any events yet.</p>
        ) : (
          <ul className="venue-list">
            {events.map((event) => (
              <li className="venue-item" key={event.id}>
                <div>
                  <Link to={`/events/${event.id}`}>
                    <strong>{event.title}</strong>
                  </Link>
                  <p className="muted">{formatShortDate(event.start_time)}</p>
                </div>
                <div className="event-actions">
                  <Link
                    to={`/events/${event.id}/edit`}
                    className="secondary-button"
                    aria-label={`Edit ${event.title}`}
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="secondary-button danger"
                    disabled={deletingId !== null}
                    onClick={() => deleteEvent(event)}
                    aria-label={`Delete ${event.title}`}
                  >
                    {deletingId === event.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}

export default MyEventsPage
