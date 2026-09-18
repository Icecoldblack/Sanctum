import { useEffect, useId, useRef, type ReactNode } from 'react'
import { getLenis } from '@/hooks/useSmoothScroll'
import { Icon } from '@/components/shared/Icon'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  /** Visually hide the title (it is still announced to screen readers). */
  hideTitle?: boolean
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Modal built on the native <dialog>: focus is trapped and restored by the browser, Esc closes
 * it, and the rest of the page is inert while it is open.
 */
export function Dialog({ open, onClose, title, hideTitle = false, children, footer, className = '' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (!open) {
      if (dialog.open) dialog.close()
      return
    }
    if (!dialog.open) dialog.showModal()
    // Freeze the smooth-scrolled page behind the modal.
    getLenis()?.stop()
    return () => getLenis()?.start()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (event.target === event.currentTarget) onClose()
      }}
      className={`m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-on-surface/40 backdrop:backdrop-blur-sm open:animate-dialog-in ${className}`}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            <h2 id={titleId} className={hideTitle ? 'sr-only' : 'text-xl font-bold tracking-tight'}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-2 ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name="close" />
            </button>
          </div>
          <div data-lenis-prevent className="overflow-y-auto px-6 pb-6">
            {children}
          </div>
          {footer && <div className="border-t border-outline-variant/20 px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
