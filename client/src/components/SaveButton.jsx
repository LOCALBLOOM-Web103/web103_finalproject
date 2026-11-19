import { useState } from 'react'
import Spinner from './Spinner.jsx'
import { useToast } from '../ToastContext.jsx'

// Save/unsave toggle for the event page; works in place, no navigation
function SaveButton({ eventId, initialSaved }) {
  const toast = useToast()
  const [saved, setSaved] = useState(initialSaved)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    try {
      const res = await fetch(`/api/events/${eventId}/save`, {
        method: saved ? 'DELETE' : 'POST',
      })
      if (!res.ok) throw new Error(`Couldn't update (${res.status})`)
      setSaved(!saved)
      toast(saved ? 'Removed from your saved events' : 'Saved to your list')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className={saved ? 'secondary-button saved' : 'secondary-button'}
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
    >
      {busy && <Spinner />}
      {saved ? '★ Saved' : '☆ Save'}
    </button>
  )
}

export default SaveButton
