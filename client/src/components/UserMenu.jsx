import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { useConfirm } from '../ConfirmContext.jsx'
import { flashToast, useToast } from '../ToastContext.jsx'

// Avatar button in the header that opens the account menu
function UserMenu() {
  const { user, logout } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  // Close when clicking anywhere outside
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Move focus into the menu when it opens
  useEffect(() => {
    if (open) menuRef.current?.querySelector('[role="menuitem"]')?.focus()
  }, [open])

  const close = (refocus = false) => {
    setOpen(false)
    if (refocus) buttonRef.current?.focus()
  }

  const onMenuKeyDown = (e) => {
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')]
    const index = items.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(index + 1) % items.length].focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(index - 1 + items.length) % items.length].focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      items[0].focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1].focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'Tab') {
      close()
    }
  }

  // Calls POST /api/reset, then reloads so every page refetches the seeded data
  async function resetDemoData() {
    close()
    if (
      !(await confirm({
        title: 'Reset demo data?',
        message:
          'All events and venues go back to the original sample data, and any you posted are deleted.',
        confirmLabel: 'Reset',
      }))
    )
      return
    setResetting(true)
    try {
      const res = await fetch('/api/reset', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Reset failed (${res.status})`)
      }
      flashToast('Demo data reset') // shown after the reload below
      window.location.assign('/')
    } catch (err) {
      toast(err.message, 'error')
      setResetting(false)
    }
  }

  const name = user.name || user.username

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        ref={buttonRef}
        className="avatar-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {user.avatar_url ? (
          <img className="avatar" src={user.avatar_url} alt="" />
        ) : (
          <span className="avatar avatar-fallback" aria-hidden="true">
            {name?.[0]?.toUpperCase() ?? '?'}
          </span>
        )}
      </button>

      {open && (
        <div
          className="user-menu-list"
          role="menu"
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
        >
          <p className="user-menu-name">{name}</p>
          <Link to="/profile" role="menuitem" onClick={() => close()}>
            My profile
          </Link>
          <Link to="/venues" role="menuitem" onClick={() => close()}>
            Manage venues
          </Link>
          <Link to="/my-events" role="menuitem" onClick={() => close()}>
            Manage events
          </Link>
          <button
            type="button"
            role="menuitem"
            className="danger"
            disabled={resetting}
            onClick={resetDemoData}
          >
            {resetting ? 'Resetting…' : 'Reset demo data'}
          </button>
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              close()
              logout()
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
