import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

function VenuesPage() {
  const { user } = useAuth()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let active = true

    async function loadVenues() {
      try {
        const response = await fetch('/api/venues')

        if (!response.ok) {
          throw new Error(`Unable to load venues (HTTP ${response.status}).`)
        }

        const data = await response.json()

        if (!Array.isArray(data)) {
          throw new Error('Unexpected venue response.')
        }

        if (active) setVenues(data)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadVenues()

    return () => {
      active = false
    }
  }, [])

  async function deleteVenue(venue) {
    const confirmed = window.confirm(
      `Delete "${venue.name}" (ID ${venue.id})?\n\n` +
        'This action cannot be undone. Venues with associated events cannot be deleted.',
    )

    if (!confirmed) return

    setDeletingId(venue.id)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`/api/venues/${venue.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        let details = {}

        try {
          details = await response.json()
        } catch {
          // Some server errors have no JSON body.
        }

        if (response.status === 409) {
          throw new Error(
            details.error ||
              'This venue cannot be deleted because it is referenced by events.',
          )
        }

        throw new Error(
          details.error || `Venue deletion failed (HTTP ${response.status}).`,
        )
      }

      setVenues((current) => current.filter((item) => item.id !== venue.id))
      setMessage(`Deleted "${venue.name}" (ID ${venue.id}).`)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="venues-page">
      <Link to="/events/new" className="back">
        Back to event form
      </Link>

      <h1>Manage Venues</h1>
      <p className="muted">
        Delete unused venues. Venues associated with events are protected.
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}

      {loading ? (
        <p>Loading venues...</p>
      ) : venues.length === 0 ? (
        <p>No venues available.</p>
      ) : (
        <ul className="venue-list">
          {venues.map((venue) => (
            <li className="venue-item" key={venue.id}>
              <div>
                <strong>{venue.name}</strong>
                <p className="muted">
                  {venue.city} · Venue ID {venue.id}
                </p>
              </div>

              {user?.id === venue.owner_id && (
                <button
                  type="button"
                  className="secondary-button danger"
                  disabled={deletingId !== null}
                  onClick={() => deleteVenue(venue)}
                  aria-label={`Delete ${venue.name}, venue ID ${venue.id}`}
                >
                  {deletingId === venue.id ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default VenuesPage
