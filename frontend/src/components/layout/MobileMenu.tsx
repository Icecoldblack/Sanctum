import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { navItems } from '@/components/layout/nav-items'
import { Icon } from '@/components/shared/Icon'
import { quickExit } from '@/features/quick-exit/quickExit'
import { openTour } from '@/features/onboarding/tourStore'
import { HOTLINE_TEL } from '@/lib/hotlines'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  // Esc closes the menu without counting toward the triple-Esc quick exit.
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-sm"
      />
      <div
        id="mobile-menu"
        className="fixed inset-x-0 top-16 z-50 border-t border-outline-variant/10 bg-surface-container-lowest px-4 pb-6 pt-4 shadow-xl"
      >
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-4 rounded-2xl px-4 font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={icon} filled={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex min-h-12 items-center gap-4 rounded-2xl px-4 font-medium transition-colors ${
                isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'
              }`
            }
          >
            <Icon name="tune" />
            Safety settings
          </NavLink>
          <button
            type="button"
            onClick={() => {
              onClose()
              openTour()
            }}
            className="flex min-h-12 items-center gap-4 rounded-2xl px-4 text-left font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Icon name="help" />
            Guide
          </button>
        </nav>
        <div className="mt-4 flex flex-col gap-3 border-t border-outline-variant/10 pt-4">
          <a
            href={HOTLINE_TEL}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-on-primary"
          >
            <Icon name="call" className="text-base" />
            Call a hotline
          </a>
          <button
            type="button"
            onClick={quickExit}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-secondary px-6 font-bold text-on-secondary"
          >
            <Icon name="logout" className="text-base" />
            Quick Exit
          </button>
        </div>
      </div>
    </div>
  )
}
