import { useState } from 'react'

// Private note on a saved event; saves when the field loses focus (or on Enter)
function SavedNote({ eventId, initialNote }) {
  const [note, setNote] = useState(initialNote ?? '')
  const [lastSaved, setLastSaved] = useState(initialNote ?? '')
  const [status, setStatus] = useState(null) // 'saving' | 'saved' | error message

  async function save() {
    if (note.trim() === lastSaved) return
    setStatus('saving')
    try {
      const res = await fetch(`/api/events/${eventId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `Save failed (${res.status})`)
      setLastSaved(body.note ?? '')
      setStatus('saved')
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <div className="saved-note">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        maxLength={280}
        placeholder="Add a note (e.g. bring a friend)"
        aria-label="Note for this saved event"
        disabled={status === 'saving'}
      />
      {status === 'saved' && <span className="muted">Saved ✓</span>}
      {status && status !== 'saving' && status !== 'saved' && (
        <span className="form-error" role="alert">
          {status}
        </span>
      )}
    </div>
  )
}

export default SavedNote
