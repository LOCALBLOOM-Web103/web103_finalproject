import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const getJson = (url) =>
  fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))

const emptyEvent = {
  title: '', venue_id: '', activity_type_id: '', start_time: '', end_time: '',
  price: '0', description: '', what_to_bring: '', tag_ids: []
}

function EventForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyEvent)
  const [options, setOptions] = useState(null) // { venues, activityTypes, tags }
  const [loadError, setLoadError] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getJson('/api/venues'), getJson('/api/activity-types'), getJson('/api/tags')])
      .then(([venues, activityTypes, tags]) => setOptions({ venues, activityTypes, tags }))
      .catch((err) => setLoadError(err.message))
  }, [])

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })
  const toggleTag = (id) => setForm({
    ...form,
    tag_ids: form.tag_ids.includes(id) ? form.tag_ids.filter((t) => t !== id) : [...form.tag_ids, id]
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.end_time <= form.start_time) return setSubmitError('End time must be after start time.')

    setSaving(true)
    setSubmitError(null)
    try {
      // Selects and number inputs give strings; the API expects integers/numbers
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          venue_id: Number(form.venue_id),
          activity_type_id: Number(form.activity_type_id),
          price: Number(form.price)
        })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
      navigate(`/events/${body.id}`)
    } catch (err) {
      setSubmitError(err.message)
      setSaving(false)
    }
  }

  if (loadError) return <p className="status">Couldn't load form options: {loadError}</p>
  if (!options) return <p className="status">Loading form…</p>

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <Link to="/" className="back">← All events</Link>
      <h1>Post a new event</h1>

      <label>
        Title
        <input required value={form.title} onChange={set('title')} />
      </label>

      <div className="form-row">
        <label>
          Venue
          <select required value={form.venue_id} onChange={set('venue_id')}>
            <option value="" disabled>Choose a venue</option>
            {options.venues.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.city})</option>)}
          </select>
        </label>
        <label>
          Activity type
          <select required value={form.activity_type_id} onChange={set('activity_type_id')}>
            <option value="" disabled>Choose a type</option>
            {options.activityTypes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          Starts
          <input type="datetime-local" required value={form.start_time} onChange={set('start_time')} />
        </label>
        <label>
          Ends
          <input type="datetime-local" required min={form.start_time} value={form.end_time} onChange={set('end_time')} />
        </label>
        <label>
          Price ($)
          <input type="number" required min="0" step="0.01" value={form.price} onChange={set('price')} />
        </label>
      </div>

      <label>
        Description
        <textarea rows="4" value={form.description} onChange={set('description')} />
      </label>
      <label>
        What to bring
        <input value={form.what_to_bring} onChange={set('what_to_bring')} />
      </label>

      <fieldset>
        <legend>Tags (pick any)</legend>
        <div className="tag-picker">
          {options.tags.map((t) => (
            <label key={t.id} className={form.tag_ids.includes(t.id) ? 'tag-option checked' : 'tag-option'}>
              <input type="checkbox" checked={form.tag_ids.includes(t.id)} onChange={() => toggleTag(t.id)} />
              #{t.name}
            </label>
          ))}
        </div>
      </fieldset>

      {submitError && <p className="form-error" role="alert">{submitError}</p>}
      <button type="submit" className="button" disabled={saving}>{saving ? 'Posting…' : 'Post event'}</button>
    </form>
  )
}

export default EventForm
