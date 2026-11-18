import { createContext, useContext, useRef, useState } from 'react'

const ConfirmContext = createContext(null)

// Replaces window.confirm with a styled modal. Usage:
//   const confirm = useConfirm()
//   if (!(await confirm({ title, message, confirmLabel }))) return
// The native <dialog> gives us the backdrop, Esc to cancel and focus trapping for free.
export function ConfirmProvider({ children }) {
  const dialogRef = useRef(null)
  const resolveRef = useRef(null)
  const [options, setOptions] = useState({})

  function confirm(opts) {
    setOptions(opts)
    dialogRef.current.returnValue = ''
    dialogRef.current.showModal()
    return new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }

  // Fires for every way the dialog closes: buttons, Esc, backdrop click
  function handleClose() {
    resolveRef.current?.(dialogRef.current.returnValue === 'confirm')
    resolveRef.current = null
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        className="confirm-modal"
        aria-labelledby="confirm-modal-title"
        onClose={handleClose}
        // A click on the dialog element itself (not its content) is a backdrop click
        onClick={(e) =>
          e.target === e.currentTarget && dialogRef.current.close()
        }
      >
        <form method="dialog" className="confirm-modal-body">
          <h2 id="confirm-modal-title">{options.title ?? 'Are you sure?'}</h2>
          {options.message && <p>{options.message}</p>}
          <div className="confirm-modal-actions">
            <button value="cancel" className="secondary-button" autoFocus>
              Cancel
            </button>
            <button value="confirm" className="secondary-button danger">
              {options.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </form>
      </dialog>
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useConfirm = () => useContext(ConfirmContext)
