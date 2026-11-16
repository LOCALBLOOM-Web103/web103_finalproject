import { useState } from 'react'

// Save/unsave toggle for the event page; works in place, no navigation
function SaveButton({ eventId, initialSaved }) {
  const [saved, setSaved] = useState(initialSaved)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/events/${eventId}/save`, {
        method: saved ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error(`Couldn't update (${res.status})`)
      setSaved(!saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={saved ? 'secondary-button saved' : 'secondary-button'}
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
      >
        {saved ? '★ Saved' : '☆ Save'}
      </button>
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </>
  )
}

export default SaveButton
