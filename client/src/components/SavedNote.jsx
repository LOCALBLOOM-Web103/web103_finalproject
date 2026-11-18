import { useState } from 'react'
import { useToast } from '../ToastContext.jsx'

// Private note on a saved event; saves when the field loses focus (or on Enter)
function SavedNote({ eventId, initialNote }) {
  const toast = useToast()
  const [note, setNote] = useState(initialNote ?? '')
  const [lastSaved, setLastSaved] = useState(initialNote ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (note.trim() === lastSaved) return
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `Save failed (${res.status})`)
      setLastSaved(body.note ?? '')
      toast(body.note ? 'Note saved' : 'Note removed')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
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
        disabled={saving}
      />
    </div>
  )
}

export default SavedNote
