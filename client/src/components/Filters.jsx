import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Dropdown from './Dropdown.jsx'

const PRICES = [
  ['free', 'Free'],
  ['$', 'Under $25'],
  ['$$', '$25–59'],
  ['$$$', '$60+'],
]
const RADII = [
  ['1', 'Within 1 mile'],
  ['5', 'Within 5 miles'],
  ['10', 'Within 10 miles'],
  ['25', 'Within 25 miles'],
]

// Lives in the site header on the home page; filters are stored in the URL so Dashboard can read them
function Filters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activityTypes, setActivityTypes] = useState([])

  useEffect(() => {
    // Filters still work by URL if the options fail to load
    fetch('/api/activity-types')
      .then((res) => (res.ok ? res.json() : []))
      .then(setActivityTypes)
      .catch(() => {})
  }, [])

  const setFilter = (name, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    setSearchParams(next)
  }

  const filterSelect = (name, label, anyText, options) => (
    <Dropdown
      label={label}
      value={searchParams.get(name) ?? ''}
      options={[['', anyText], ...options]}
      onChange={(value) => setFilter(name, value)}
    />
  )

  return (
    <div className="filters" role="group" aria-label="Filter events">
      {filterSelect('tier', 'Price', 'Any price', PRICES)}
      {filterSelect(
        'activity_type',
        'Type',
        'All activity types',
        activityTypes.map((a) => [a.name, a.name]),
      )}
      {filterSelect('radius', 'Distance', 'Any distance', RADII)}
    </div>
  )
}

export default Filters
