import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const ToastContext = createContext(null)

const TOAST_MS = 4000
const MAX_TOASTS = 3
const FLASH_KEY = 'flash'

// Short feedback messages after user actions. Usage:
//   const toast = useToast()
//   toast('Event deleted')            // success
//   toast(err.message, 'error')       // error
// Mounted above the routes, so a toast stays visible after navigate().
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback(
    (id) => setToasts((list) => list.filter((t) => t.id !== id)),
    [],
  )

  const toast = useCallback(
    (message, type = 'success') => {
      const id = nextId.current++
      setToasts((list) => [...list, { id, message, type }].slice(-MAX_TOASTS))
      setTimeout(() => dismiss(id), TOAST_MS)
    },
    [dismiss],
  )

  // A message saved by flashToast() before a full page reload (reset demo data)
  useEffect(() => {
    try {
      const message = sessionStorage.getItem(FLASH_KEY)
      if (!message) return
      sessionStorage.removeItem(FLASH_KEY)
      toast(message)
    } catch {
      // storage blocked (private mode): skip the message, nothing else breaks
    }
  }, [toast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <span className="toast-icon" aria-hidden="true">
              {t.type === 'error' ? '!' : '✓'}
            </span>
            <span className="toast-message">{t.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)

// Shows a success toast after the next full page load (window.location changes wipe React state)
// eslint-disable-next-line react-refresh/only-export-components
export function flashToast(message) {
  try {
    sessionStorage.setItem(FLASH_KEY, message)
  } catch {
    // storage blocked: the reload still happens, just without the message
  }
}
