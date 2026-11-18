import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDay, formatTimeRange } from '../format.js'

// Shared attributes for the line icons next to each fact
const ICON = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Bottom sheet that slides up over the home page with an event's basic details.
// Closes with the X, the Escape key, or a click on the dimmed area behind it.
function EventModal({ event, onClose }) {
  const [closing, setClosing] = useState(false)
  const sheetRef = useRef(null)
  const closeRef = useRef(null)
  const price = Number(event.price)

  // Slide down, then unmount (straight away if the visitor prefers reduced motion)
  const requestClose = () => {
    if (prefersReducedMotion()) onClose()
    else setClosing(true)
  }

  // Keep the page behind from scrolling, put focus in the dialog, and give it back afterwards
  useEffect(() => {
    const opener = document.activeElement
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const previousOverflow = document.body.style.overflow
    const previousPadding = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPadding
      opener?.focus?.()
    }
  }, [])

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      requestClose()
    } else if (e.key === 'Tab') {
      // Keep Tab inside the dialog
      const focusable = sheetRef.current.querySelectorAll('a[href], button')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div
      className={`modal-backdrop${closing ? ' closing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose()
      }}
      onKeyDown={onKeyDown}
    >
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={sheetRef}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) onClose()
        }}
      >
        <button
          type="button"
          className="modal-close"
          ref={closeRef}
          onClick={requestClose}
          aria-label="Close"
        >
          <svg {...ICON} width="20" height="20" strokeWidth="2.5">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {event.images[0] && (
          <img className="modal-image" src={event.images[0]} alt="" />
        )}
        <span className="pill">{event.activity_type}</span>
        <h2 id="modal-title">{event.title}</h2>
        <p className="modal-price">
          {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
        </p>

        <ul className="facts">
          <li>
            <svg {...ICON}>
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
            <span className="sr-only">Date: </span>
            <span>{formatDay(event.start_time)}</span>
          </li>
          <li>
            <svg {...ICON}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span className="sr-only">Time: </span>
            <span>{formatTimeRange(event.start_time, event.end_time)}</span>
          </li>
          <li>
            <svg {...ICON}>
              <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            <span className="sr-only">Address: </span>
            <span>
              {event.venue_name}
              <br />
              {event.address}, {event.city}
            </span>
          </li>
        </ul>

        <Link to={`/events/${event.id}`} className="button modal-more">
          See full details →
        </Link>
      </div>
    </div>
  )
}

export default EventModal
