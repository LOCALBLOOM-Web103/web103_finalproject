import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, priceTier } from '../format.js'

function Dashboard() {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/events')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
      .then(setEvents)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="status">Couldn't load events: {error}</p>
  if (!events) return <p className="status">Loading events…</p>

  return (
    <>
      <h1>Discover local creative events</h1>
      <div className="event-grid">
        {events.map((event) => (
          <Link to={`/events/${event.id}`} className="event-card" key={event.id}>
            <img src={event.images[0]} alt="" />
            <div className="event-card-body">
              <span className="pill">{event.activity_type}</span>
              <h2>{event.title}</h2>
              <p className="muted">{event.venue_name} · {event.city}</p>
              <p className="muted">{formatDate(event.start_time)} · {priceTier(event.price)}</p>
              <ul className="tags">
                {event.tags.map((tag) => <li key={tag}>#{tag}</li>)}
              </ul>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export default Dashboard
