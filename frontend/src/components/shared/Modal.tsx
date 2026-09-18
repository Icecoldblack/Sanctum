import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from '@/components/shared/Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Focus-trapping dialog. Uses the native <dialog> element's modal behaviour so
 * the browser handles the backdrop, inertness of the page behind it, and Esc.
 *
 * Esc is deliberately intercepted here: the app-wide triple-Esc quick exit
 * should not fire while someone is only trying to dismiss a dialog.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') e.stopPropagation()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className="w-[min(32rem,calc(100vw-2rem))] rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-inverse-surface/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4 px-8 pt-8">
        <h2 id="modal-title" className="text-2xl font-bold tracking-tight text-on-surface">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="px-8 pb-8 pt-4">{children}</div>
    </dialog>
  )
}
