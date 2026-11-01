import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDate, priceTier } from '../format.js'

function EventPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status === 404 ? 'Event not found' : `Request failed (${res.status})`))))
      .then(setEvent)
      .catch((err) => setError(err.message))
  }, [id])

  if (error) return <p className="status">{error}. <Link to="/">Back to events</Link></p>
  if (!event) return <p className="status">Loading event…</p>

  const price = Number(event.price)

  return (
    <article className="event-page">
      <Link to="/" className="back">← All events</Link>
      {event.images[0] && <img className="hero" src={event.images[0]} alt="" />}

      <span className="pill">{event.activity_type}</span>
      <h1>{event.title}</h1>
      <ul className="tags">
        {event.tags.map((tag) => <li key={tag}>#{tag}</li>)}
      </ul>

      <dl className="details">
        <dt>When</dt>
        <dd>{formatDate(event.start_time)} – {formatDate(event.end_time)}</dd>
        <dt>Price</dt>
        <dd>{price === 0 ? 'Free' : `$${price.toFixed(2)} (${priceTier(price)})`}</dd>
        <dt>Where</dt>
        <dd>{event.venue_name}<br />{event.address}, {event.city}</dd>
        <dt>Venue hours</dt>
        <dd>{event.hours}</dd>
      </dl>

      <h2>What you'll do</h2>
      <p>{event.description}</p>
      <h2>What to bring</h2>
      <p>{event.what_to_bring}</p>

      {event.website_url && (
        <a className="button" href={event.website_url} target="_blank" rel="noreferrer">Visit venue website</a>
      )}
    </article>
  )
}

export default EventPage
