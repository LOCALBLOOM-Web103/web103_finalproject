import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { milesBetween } from '../format.js'
import EventCard from '../components/EventCard.jsx'
import EventModal from '../components/EventModal.jsx'
import Loading from '../components/Loading.jsx'
import Spinner from '../components/Spinner.jsx'

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

// Container: fetches events and works out distances; EventCard draws each tile
function Dashboard() {
  // Filters are set by the header (?tier=$$&activity_type=Workshop&radius=10)
  const [searchParams] = useSearchParams()
  const radius = Number(searchParams.get('radius')) || null
  // Distance is filtered here in the browser, so leave it out of the API request
  const serverParams = new URLSearchParams(searchParams)
  serverParams.delete('radius')
  const query = serverParams.toString()

  const [events, setEvents] = useState(null)
  const [loadedQuery, setLoadedQuery] = useState(null) // the filters `events` belongs to
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null) // event shown in the quick-view modal
  const { location, unavailable } = useUserLocation()

  useEffect(() => {
    let stale = false // ignore responses from an older filter combination
    getJson(`/api/events${query ? `?${query}` : ''}`)
      .then((data) => {
        if (!stale) {
          setEvents(data)
          setLoadedQuery(query)
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
  if (!events) return <Loading label="Loading events…" />
  // Filters changed and the new results haven't arrived yet: keep the old tiles, dimmed
  const refreshing = loadedQuery !== query

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
          {unavailable ? (
            'Allow location access to filter by distance.'
          ) : (
            <>
              <Spinner /> Finding your location…
            </>
          )}
        </p>
      )}
      {refreshing && (
        <p className="notice" role="status">
          <Spinner /> Updating events…
        </p>
      )}
      {!visible.length ? (
        <p className="status">No events match these filters.</p>
      ) : (
        <div
          className={`tile-grid${refreshing ? ' is-refreshing' : ''}`}
          aria-busy={refreshing}
        >
          {visible.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              distance={event.distance}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}
      {selected && (
        <EventModal event={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

export default Dashboard
