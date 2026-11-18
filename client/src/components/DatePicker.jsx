import { useEffect, useRef, useState } from 'react'
import { formatPickedDate, fromISODate, toISODate } from '../dateTime.js'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)

// A calendar popup that looks like the site's dropdowns.
// value / minDate are "YYYY-MM-DD" strings; days before minDate can't be picked.
// Keys: arrows move by day or week, Home/End to the row's ends, PageUp/PageDown by month,
// Enter/Space picks, Escape closes.
function DatePicker({ label, value, onChange, minDate }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => startOfMonth(new Date()))
  const [focused, setFocused] = useState(toISODate(new Date()))
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const gridRef = useRef(null)
  const today = toISODate(new Date())

  const openCalendar = () => {
    // Start on the chosen day, else the earliest allowed day, else today
    const start = value || (minDate && minDate > today ? minDate : today)
    setView(startOfMonth(fromISODate(start)))
    setFocused(start)
    setOpen(true)
  }
  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) buttonRef.current?.focus()
  }
  const pick = (iso) => {
    onChange(iso)
    close()
  }

  // Close when clicking anywhere outside
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Keep keyboard focus on the highlighted day
  useEffect(() => {
    if (open)
      gridRef.current?.querySelector(`[data-date="${focused}"]`)?.focus()
  }, [open, focused, view])

  const goTo = (date) => {
    const iso = toISODate(date)
    if (minDate && iso < minDate) return
    setFocused(iso)
    setView(startOfMonth(date))
  }
  const shiftMonth = (delta) => {
    const next = new Date(view.getFullYear(), view.getMonth() + delta, 1)
    setView(next)
    // Focus the same day number in the new month (or its last day)
    const day = Math.min(
      fromISODate(focused).getDate(),
      new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate(),
    )
    const target = new Date(next.getFullYear(), next.getMonth(), day)
    const iso = toISODate(target)
    setFocused(minDate && iso < minDate ? minDate : iso)
  }

  const onGridKeyDown = (e) => {
    const current = fromISODate(focused)
    const step = (days) => {
      e.preventDefault()
      const next = new Date(current)
      next.setDate(next.getDate() + days)
      goTo(next)
    }
    if (e.key === 'ArrowLeft') step(-1)
    else if (e.key === 'ArrowRight') step(1)
    else if (e.key === 'ArrowUp') step(-7)
    else if (e.key === 'ArrowDown') step(7)
    else if (e.key === 'Home') step(-current.getDay())
    else if (e.key === 'End') step(6 - current.getDay())
    else if (e.key === 'PageUp') {
      e.preventDefault()
      shiftMonth(-1)
    } else if (e.key === 'PageDown') {
      e.preventDefault()
      shiftMonth(1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') close(false)
  }

  // Leading blanks line the 1st up under its weekday, then one cell per day
  const year = view.getFullYear()
  const month = view.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array.from({ length: view.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toISODate(new Date(year, month, i + 1)),
    ),
  ]

  return (
    <div className={`field-dropdown${open ? ' open' : ''}`} ref={rootRef}>
      <button
        type="button"
        ref={buttonRef}
        className="field-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={value ? `${label}: ${formatPickedDate(value)}` : label}
        onClick={() => (open ? close() : openCalendar())}
      >
        <span className={value ? undefined : 'placeholder'}>
          {value ? formatPickedDate(value) : 'Pick a date'}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>

      {open && (
        <div className="calendar" role="dialog" aria-label={`Choose ${label}`}>
          <div className="calendar-head">
            <button
              type="button"
              className="calendar-nav"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              <svg {...NAV_ICON}>
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <span aria-live="polite">
              {view.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <button
              type="button"
              className="calendar-nav"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              <svg {...NAV_ICON}>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <div
            className="calendar-grid"
            ref={gridRef}
            onKeyDown={onGridKeyDown}
          >
            {WEEKDAYS.map((d, i) => (
              <span className="calendar-weekday" key={i} aria-hidden="true">
                {d}
              </span>
            ))}
            {cells.map((iso, i) =>
              iso ? (
                <button
                  type="button"
                  key={iso}
                  data-date={iso}
                  className={`calendar-day${iso === today ? ' today' : ''}`}
                  tabIndex={iso === focused ? 0 : -1}
                  aria-pressed={iso === value}
                  aria-label={formatPickedDate(iso)}
                  disabled={Boolean(minDate) && iso < minDate}
                  onClick={() => pick(iso)}
                >
                  {Number(iso.slice(8))}
                </button>
              ) : (
                <span key={`blank-${i}`} />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const NAV_ICON = {
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export default DatePicker
