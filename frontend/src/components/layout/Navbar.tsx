import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { navItems } from '@/components/layout/nav-items'
import { QuickExitButton } from '@/components/layout/QuickExitButton'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { Icon } from '@/components/shared/Icon'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { activeDisguise } from '@/features/preferences/preferences'
import { AppIcon } from '@/features/disguise/AppIcon'
import { openTour } from '@/features/onboarding/tourStore'

interface NavbarProps {
  quickExitIcon?: boolean
}

export function Navbar({ quickExitIcon = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const disguise = activeDisguise(usePreferences().prefs)

  // Close the menu whenever the route changes, including taps on the current link.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <>
      <nav className="print:hidden fixed top-0 w-full z-50 bg-[#fafaf5]/80 backdrop-blur-md shadow-sm shadow-[#2f342e]/5">
        <div className="flex justify-between items-center gap-2 px-4 sm:px-6 py-3 w-full max-w-screen-2xl mx-auto">
          <NavLink to="/" className="flex min-w-0 items-center gap-2 text-xl font-bold tracking-tighter text-[#4c6557]">
            <AppIcon icon={disguise.icon} name={disguise.name} size={28} />
            <span className="truncate max-w-[8rem] sm:max-w-[16rem]">{disguise.name}</span>
          </NavLink>
          <div className="hidden lg:flex gap-8 items-center font-body text-sm tracking-tight">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'text-[#4c6557] font-semibold border-b-2 border-[#4c6557]'
                    : 'text-[#5c605a] hover:bg-[#edefe8] transition-colors px-2 py-1 rounded-lg'
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* On phones these two live in the menu, so the bar never overflows. */}
            <button
              type="button"
              onClick={openTour}
              aria-label="Open the guide"
              title="Guide"
              className="hidden sm:flex h-11 w-11 items-center justify-center rounded-full text-[#5c605a] hover:bg-[#edefe8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4c6557]"
            >
              <Icon name="help" />
            </button>
            <NavLink
              to="/settings"
              aria-label="Safety settings"
              title="Safety settings"
              className={({ isActive }) =>
                `hidden sm:flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#edefe8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4c6557] ${
                  isActive ? 'bg-[#edefe8] text-[#4c6557]' : 'text-[#5c605a]'
                }`
              }
            >
              <Icon name="tune" />
            </NavLink>
            <span className="sm:ml-2">
              <QuickExitButton showIcon={quickExitIcon} />
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="lg:hidden flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>
      </nav>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
