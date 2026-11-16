import { useEffect, useId, useRef, useState } from 'react'

// A styled replacement for <select>, following the ARIA "select-only combobox/listbox" pattern:
// Enter/Space/ArrowDown opens, arrows/Home/End move, Enter/Space picks, Escape/Tab closes.
// variant "filter" (default): label and value inline, for the header filters.
// variant "field": a form input; the visible label lives in the form, `placeholder` shows until a pick.
function Dropdown({
  label,
  value,
  options,
  onChange,
  variant = 'filter',
  placeholder,
}) {
  const isField = variant === 'field'
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const listRef = useRef(null)

  const foundIndex = options.findIndex(([v]) => v === value)
  const selectedIndex = Math.max(0, foundIndex)
  const selectedText =
    foundIndex >= 0 ? options[foundIndex][1] : (placeholder ?? '')

  // Close when clicking anywhere outside
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open])

  // Long lists (like the states) scroll; keep the highlighted option in view
  useEffect(() => {
    if (open)
      listRef.current
        ?.querySelector('.active')
        ?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const openList = () => {
    setActive(selectedIndex)
    setOpen(true)
  }
  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) buttonRef.current?.focus()
  }
  const pick = (index) => {
    onChange(options[index][0])
    close()
  }

  const onButtonKeyDown = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      openList()
    }
  }

  const onListKeyDown = (e) => {
    const last = options.length - 1
    const moves = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    }
    if (e.key in moves) {
      e.preventDefault()
      setActive(moves[e.key])
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(active)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') close(false)
  }

  return (
    <div
      className={`${isField ? 'field-dropdown' : 'filter'}${open ? ' open' : ''}`}
      ref={rootRef}
    >
      <span
        id={`${id}-label`}
        className={isField ? 'sr-only' : undefined}
        onClick={() => (open ? close() : openList())}
      >
        {label}
      </span>
      <button
        type="button"
        ref={buttonRef}
        id={`${id}-button`}
        className={isField ? 'field-button' : 'filter-button'}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-button`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKeyDown}
      >
        <span className={foundIndex < 0 ? 'placeholder' : undefined}>
          {selectedText}
        </span>
        <svg
          className="chevron"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          ref={listRef}
          className="filter-menu"
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKeyDown}
        >
          {options.map(([optValue, text], i) => (
            <li
              key={optValue}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === foundIndex}
              className={i === active ? 'active' : undefined}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(i)}
            >
              {text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dropdown
