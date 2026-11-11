import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatShortDate, milesBetween, priceTier } from '../format.js'

const getJson = (url) =>
  fetch(url).then((res) =>
    res.ok
      ? res.json()
      : Promise.reject(new Error(`Request failed (${res.status})`)),
  )

// Browser location, used for the distance shown on each tile and the distance filter
function useUserLocation() {
  const [location, setLocation] = useState(null)
  const [unavailable, setUnavailable] = useState(!navigator.geolocation)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setLocation({ lat: coords.latitude, lng: coords.longitude }),
      () => setUnavailable(true),
      { maximumAge: 10 * 60 * 1000 },
    )
  }, [])

  return { location, unavailable }
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  )
}

function Dashboard() {
  // Filters are set by the header (?tier=$$&activity_type=Workshop&radius=10)
  const [searchParams] = useSearchParams()
  const radius = Number(searchParams.get('radius')) || null
  // Distance is filtered here in the browser, so leave it out of the API request
  const serverParams = new URLSearchParams(searchParams)
  serverParams.delete('radius')
  const query = serverParams.toString()

  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)
  const { location, unavailable } = useUserLocation()

  useEffect(() => {
    let stale = false // ignore responses from an older filter combination
    getJson(`/api/events${query ? `?${query}` : ''}`)
      .then((data) => {
        if (!stale) {
          setEvents(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!stale) setError(err.message)
      })
    return () => {
      stale = true
    }
  }, [query])

  if (error) return <p className="status">Couldn't load events: {error}</p>
  if (!events) return <p className="status">Loading events…</p>

  const withDistance = events.map((event) => ({
    ...event,
    distance:
      location && event.latitude != null && event.longitude != null
        ? milesBetween(location, {
            lat: Number(event.latitude),
            lng: Number(event.longitude),
          })
        : null,
  }))
  const visible =
    radius && location
      ? withDistance.filter((e) => e.distance !== null && e.distance <= radius)
      : withDistance

  return (
    <>
      {radius && !location && (
        <p className="notice">
          {unavailable
            ? 'Allow location access to filter by distance.'
            : 'Finding your location…'}
        </p>
      )}
      {!visible.length ? (
        <p className="status">No events match these filters.</p>
      ) : (
        <div className="tile-grid">
          {visible.map((event) => (
            <Link to={`/events/${event.id}`} className="tile" key={event.id}>
              {event.images[0] ? (
                <img src={event.images[0]} alt="" loading="lazy" />
              ) : (
                <div className="img-placeholder" aria-hidden="true">
                  🌸
                </div>
              )}
              <div className="tile-info">
                <h2>{event.title}</h2>
                <p className="tile-type">{event.activity_type}</p>
                <p className="tile-meta">
                  {event.distance !== null && (
                    <span>
                      <PinIcon />{' '}
                      {event.distance < 10
                        ? event.distance.toFixed(1)
                        : Math.round(event.distance)}{' '}
                      mi
                    </span>
                  )}
                  <span>{priceTier(event.price)}</span>
                  <span>{formatShortDate(event.start_time)}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

export default Dashboard
