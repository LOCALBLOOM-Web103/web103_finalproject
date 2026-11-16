import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Dropdown from '../components/Dropdown.jsx'
import TagPicker from '../components/TagPicker.jsx'
import Loading from '../components/Loading.jsx'

const getJson = (url) =>
  fetch(url).then((res) =>
    res.ok
      ? res.json()
      : Promise.reject(new Error(`Request failed (${res.status})`)),
  )

const US_STATES = [
  ['AL', 'Alabama'],
  ['AK', 'Alaska'],
  ['AZ', 'Arizona'],
  ['AR', 'Arkansas'],
  ['CA', 'California'],
  ['CO', 'Colorado'],
  ['CT', 'Connecticut'],
  ['DE', 'Delaware'],
  ['FL', 'Florida'],
  ['GA', 'Georgia'],
  ['HI', 'Hawaii'],
  ['ID', 'Idaho'],
  ['IL', 'Illinois'],
  ['IN', 'Indiana'],
  ['IA', 'Iowa'],
  ['KS', 'Kansas'],
  ['KY', 'Kentucky'],
  ['LA', 'Louisiana'],
  ['ME', 'Maine'],
  ['MD', 'Maryland'],
  ['MA', 'Massachusetts'],
  ['MI', 'Michigan'],
  ['MN', 'Minnesota'],
  ['MS', 'Mississippi'],
  ['MO', 'Missouri'],
  ['MT', 'Montana'],
  ['NE', 'Nebraska'],
  ['NV', 'Nevada'],
  ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'],
  ['NY', 'New York'],
  ['NC', 'North Carolina'],
  ['ND', 'North Dakota'],
  ['OH', 'Ohio'],
  ['OK', 'Oklahoma'],
  ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'],
  ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'],
  ['SD', 'South Dakota'],
  ['TN', 'Tennessee'],
  ['TX', 'Texas'],
  ['UT', 'Utah'],
  ['VT', 'Vermont'],
  ['VA', 'Virginia'],
  ['WA', 'Washington'],
  ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
  ['DC', 'Washington, DC'],
]
const emptyEvent = {
  title: '',
  venue_id: '',
  activity_type_id: '',
  start_time: '',
  end_time: '',
  price: '0',
  description: '',
  what_to_bring: '',
  image_url: '',
  tag_ids: [],
}

// API timestamp -> "YYYY-MM-DDTHH:mm" in the browser's local time, the format datetime-local needs
// ponytail: assumes browser and server share a timezone (true in dev); store timestamptz if deployed users span zones
const toInputTime = (ts) => {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// API event -> form state; the API returns tag names, the form tracks tag ids
const toForm = (event, tags) => ({
  title: event.title,
  venue_id: String(event.venue_id),
  activity_type_id: String(event.activity_type_id),
  start_time: toInputTime(event.start_time),
  end_time: toInputTime(event.end_time),
  price: String(Number(event.price)),
  description: event.description ?? '',
  what_to_bring: event.what_to_bring ?? '',
  image_url: event.images?.[0] ?? '',
  tag_ids: tags.filter((t) => event.tags.includes(t.name)).map((t) => t.id),
})

// Used for both /events/new (create) and /events/:id/edit (edit)
function EventForm() {
  const { id } = useParams()
  const isEdit = id !== undefined
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyEvent)
  const [options, setOptions] = useState(null) // { venues, activityTypes, tags }
  const [loadError, setLoadError] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1) // the form has two pages
  const step1Ref = useRef(null)

  useEffect(() => {
    Promise.all([
      getJson('/api/venues'),
      getJson('/api/activity-types'),
      getJson('/api/tags'),
      isEdit ? getJson(`/api/events/${id}`) : null,
    ])
      .then(([venues, activityTypes, tags, event]) => {
        if (event) setForm(toForm(event, tags))
        setOptions({ venues, activityTypes, tags })
      })
      .catch((err) => setLoadError(err.message))
  }, [id, isEdit])

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })
  const toggleTag = (id) =>
    setForm({
      ...form,
      tag_ids: form.tag_ids.includes(id)
        ? form.tag_ids.filter((t) => t !== id)
        : [...form.tag_ids, id],
    })

  const [venueMode, setVenueMode] = useState('existing')

  const [newVenue, setNewVenue] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website_url: '',
    latitude: '',
    longitude: '',
  })

  const [geoLoading, setGeoLoading] = useState(false)
  const [geoStatus, setGeoStatus] = useState('')

  const updateVenue = (field) => (event) => {
    const value = event.target.value

    setNewVenue((current) => ({
      ...current,
      [field]: value,
    }))

    if (['address', 'city', 'state', 'zip_code'].includes(field)) {
      setGeoStatus('')
      setNewVenue((current) => ({
        ...current,
        latitude: '',
        longitude: '',
      }))
    }
  }

  const findCoordinates = async () => {
    setGeoLoading(true)
    setGeoStatus('')

    try {
      const params = new URLSearchParams({
        address: newVenue.address,
        city: newVenue.city,
        state: newVenue.state,
        zip_code: newVenue.zip_code,
      })

      const response = await fetch(`/api/geocode?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to find coordinates.')
      }

      setNewVenue((current) => ({
        ...current,
        latitude: String(result.latitude),
        longitude: String(result.longitude),
      }))

      setGeoStatus('Coordinates found. You can edit them.')
    } catch (error) {
      setGeoStatus(error.message)
    } finally {
      setGeoLoading(false)
    }
  }
  // Checks page 1 (the custom dropdowns can't use the browser's own "required" check)
  const goNext = () => {
    for (const field of step1Ref.current.querySelectorAll('input, textarea')) {
      if (!field.checkValidity()) return field.reportValidity()
    }
    if (!form.activity_type_id)
      return setSubmitError('Choose an activity type.')
    if (venueMode === 'existing' && !form.venue_id)
      return setSubmitError('Choose a venue.')
    if (venueMode === 'new' && !newVenue.state)
      return setSubmitError('Choose a state for the new venue.')
    setSubmitError(null)
    setStep(2)
    window.scrollTo({ top: 0 })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step === 1) return goNext() // Enter on page 1 goes to page 2 instead of submitting
    if (form.end_time <= form.start_time)
      return setSubmitError('End time must be after start time.')

    setSaving(true)
    setSubmitError(null)
    try {
      // Selects and number inputs give strings; the API expects integers/numbers
      const res = await fetch(isEdit ? `/api/events/${id}` : '/api/events', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          venue_id: venueMode === 'new' ? null : Number(form.venue_id),
          ...(venueMode === 'new'
            ? {
                new_venue: {
                  name: newVenue.name.trim(),
                  address: newVenue.address.trim(),
                  city: newVenue.city.trim(),
                  state: newVenue.state,
                  zip_code: newVenue.zip_code.trim(),
                  website_url: newVenue.website_url.trim() || null,
                  latitude:
                    newVenue.latitude === '' ? null : Number(newVenue.latitude),
                  longitude:
                    newVenue.longitude === ''
                      ? null
                      : Number(newVenue.longitude),
                },
              }
            : {}),
          activity_type_id: Number(form.activity_type_id),
          price: Number(form.price),
        }),
      })
      const body = await res.json()
      if (!res.ok)
        throw new Error(body.error || `Request failed (${res.status})`)
      navigate(`/events/${body.id}`)
    } catch (err) {
      setSubmitError(err.message)
      setSaving(false)
    }
  }

  if (loadError)
    return (
      <p className="status">
        Couldn't load the form: {loadError}. <Link to="/">Back to events</Link>
      </p>
    )
  if (!options) return <Loading label="Loading form…" />

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      {isEdit ? (
        <Link to={`/events/${id}`} className="back">
          ← Back to event
        </Link>
      ) : (
        <Link to="/" className="back">
          ← All events
        </Link>
      )}
      <h1>{isEdit ? 'Edit event' : 'Post a new event'}</h1>
      <p className="step-indicator">Step {step} of 2</p>

      {/* Page 1: the basics. Hidden (not removed) on page 2 so nothing typed is lost. */}
      <div className="form-page" ref={step1Ref} hidden={step !== 1}>
        <label>
          Title
          <input required value={form.title} onChange={set('title')} />
        </label>

        <div className="field">
          <span className="field-label">Activity type</span>
          <Dropdown
            variant="field"
            label="Activity type"
            placeholder="Choose a type"
            value={form.activity_type_id}
            options={options.activityTypes.map((a) => [String(a.id), a.name])}
            onChange={(value) => setForm({ ...form, activity_type_id: value })}
          />
        </div>

        <fieldset>
          <legend>Venue</legend>
          <div className="choices">
            <label className="choice">
              <input
                type="radio"
                name="venueMode"
                checked={venueMode === 'existing'}
                onChange={() => setVenueMode('existing')}
              />
              Select an existing venue
            </label>
            <label className="choice">
              <input
                type="radio"
                name="venueMode"
                checked={venueMode === 'new'}
                onChange={() => setVenueMode('new')}
              />
              Add a new venue
            </label>
          </div>
          {venueMode === 'existing' ? (
            <div className="field">
              <span className="field-label">Venue</span>
              <Dropdown
                variant="field"
                label="Venue"
                placeholder="Choose a venue"
                value={form.venue_id}
                options={options.venues.map((v) => [
                  String(v.id),
                  `${v.name} (${v.city})`,
                ])}
                onChange={(value) => setForm({ ...form, venue_id: value })}
              />
              <div className="venue-management-link">
                <Link to="/venues">Manage venues</Link>
              </div>
            </div>
          ) : (
            <div className="new-venue">
              <label>
                Venue name
                <input
                  required
                  value={newVenue.name}
                  onChange={updateVenue('name')}
                />
              </label>
              <label>
                Street address
                <input
                  required
                  value={newVenue.address}
                  onChange={updateVenue('address')}
                />
              </label>
              <label>
                City
                <input
                  required
                  value={newVenue.city}
                  onChange={updateVenue('city')}
                />
              </label>
              <div className="field">
                <span className="field-label">State</span>
                <Dropdown
                  variant="field"
                  label="State"
                  placeholder="Choose a state"
                  value={newVenue.state}
                  options={US_STATES}
                  onChange={(value) =>
                    updateVenue('state')({ target: { value } })
                  }
                />
              </div>
              <label>
                ZIP code (optional)
                <input
                  value={newVenue.zip_code}
                  onChange={updateVenue('zip_code')}
                  inputMode="numeric"
                  pattern="[0-9]{5}(-[0-9]{4})?"
                  placeholder="33312"
                />
              </label>
              <label>
                Website (optional)
                <input
                  type="url"
                  value={newVenue.website_url}
                  onChange={updateVenue('website_url')}
                />
              </label>
              <button
                type="button"
                className="secondary-button"
                onClick={findCoordinates}
                disabled={
                  geoLoading ||
                  !newVenue.address.trim() ||
                  !newVenue.city.trim() ||
                  !newVenue.state
                }
              >
                {geoLoading ? 'Finding coordinates...' : 'Find coordinates'}
              </button>
              {geoStatus && <p role="status">{geoStatus}</p>}
              <div className="form-row">
                <label>
                  Latitude
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={newVenue.latitude}
                    onChange={updateVenue('latitude')}
                  />
                </label>
                <label>
                  Longitude
                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={newVenue.longitude}
                    onChange={updateVenue('longitude')}
                  />
                </label>
              </div>
            </div>
          )}
        </fieldset>

        <TagPicker
          tags={options.tags}
          selected={form.tag_ids}
          onToggle={toggleTag}
        />
      </div>

      {/* Page 2: everything else, with the optional picture last */}
      <div className="form-page" hidden={step !== 2}>
        <div className="form-row">
          <label>
            Starts
            <input
              type="datetime-local"
              required
              value={form.start_time}
              onChange={set('start_time')}
            />
          </label>
          <label>
            Ends
            <input
              type="datetime-local"
              required
              min={form.start_time}
              value={form.end_time}
              onChange={set('end_time')}
            />
          </label>
          <label>
            Price ($)
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={set('price')}
            />
          </label>
        </div>

        <label>
          Description
          <textarea
            rows="4"
            value={form.description}
            onChange={set('description')}
          />
        </label>

        <label>
          What to bring
          <input value={form.what_to_bring} onChange={set('what_to_bring')} />
        </label>

        <label>
          Picture URL (optional)
          <input
            type="url"
            placeholder="https://example.com/event-photo.jpg"
            value={form.image_url}
            onChange={set('image_url')}
          />
        </label>
        {form.image_url.trim() && (
          <div className="event-image-preview">
            <img
              src={form.image_url.trim()}
              alt="Event picture preview"
              style={{
                maxWidth: '100%',
                maxHeight: '250px',
                objectFit: 'cover',
                borderRadius: '16px',
              }}
            />
          </div>
        )}
      </div>

      {submitError && (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      )}
      <div className="form-actions">
        {step === 1 ? (
          <button type="button" className="button" onClick={goNext}>
            Next →
          </button>
        ) : (
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setSubmitError(null)
                setStep(1)
              }}
            >
              ← Back
            </button>
            <button type="submit" className="button" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Post event'}
            </button>
          </>
        )}
      </div>
    </form>
  )
}

export default EventForm
