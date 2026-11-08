import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatDate, priceTier } from '../format.js'

const getJson = (url) =>
  fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))

const TIERS = [['free', 'Free'], ['$', '$ (under $25)'], ['$$', '$$ ($25–59)'], ['$$$', '$$$ ($60+)']]

function Dashboard() {
  // Filters live in the URL (?activity_type=Workshop&tier=$$&tag=pottery) so views are shareable
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.toString()
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)
  const [activityTypes, setActivityTypes] = useState([])
  const [tags, setTags] = useState([])

  useEffect(() => {
    // Dropdown options; filters still work by URL if these fail to load
    getJson('/api/activity-types').then(setActivityTypes).catch(() => {})
    getJson('/api/tags').then(setTags).catch(() => {})
  }, [])

  useEffect(() => {
    let stale = false // ignore responses from an older filter combination
    getJson(`/api/events${query ? `?${query}` : ''}`)
      .then((data) => { if (!stale) { setEvents(data); setError(null) } })
      .catch((err) => { if (!stale) setError(err.message) })
    return () => { stale = true }
  }, [query])

  const setFilter = (name, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    setSearchParams(next)
  }

  const filterSelect = (name, label, options) => (
    <label>
      {label}
      <select value={searchParams.get(name) ?? ''} onChange={(e) => setFilter(name, e.target.value)}>
        <option value="">Any</option>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
  )

  return (
    <>
      <h1>Discover local creative events</h1>
      <form className="filter-bar" onSubmit={(e) => e.preventDefault()}>
        {filterSelect('activity_type', 'Activity type', activityTypes.map((a) => [a.name, a.name]))}
        {filterSelect('tier', 'Budget', TIERS)}
        {filterSelect('tag', 'Tag', tags.map((t) => [t.name, `#${t.name}`]))}
        {query && <button type="button" className="link-button" onClick={() => setSearchParams({})}>Clear filters</button>}
      </form>

      {error ? (
        <p className="status">Couldn't load events: {error}</p>
      ) : !events ? (
        <p className="status">Loading events…</p>
      ) : !events.length ? (
        <p className="status">No events match these filters.</p>
      ) : (
      <div className="event-grid">
        {events.map((event) => (
          <Link to={`/events/${event.id}`} className="event-card" key={event.id}>
            {event.images[0] ? <img src={event.images[0]} alt="" /> : <div className="img-placeholder" aria-hidden="true">🌸</div>}
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
      )}
    </>
  )
}

export default Dashboard
