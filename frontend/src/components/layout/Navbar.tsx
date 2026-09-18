import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { navItems } from '@/components/layout/nav-items'
import { QuickExitButton } from '@/components/layout/QuickExitButton'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { Icon } from '@/components/shared/Icon'

interface NavbarProps {
  quickExitIcon?: boolean
}

export function Navbar({ quickExitIcon = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Close the menu whenever the route changes, including taps on the current link.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#fafaf5]/80 backdrop-blur-md shadow-sm shadow-[#2f342e]/5">
        <div className="flex justify-between items-center px-6 py-3 w-full max-w-screen-2xl mx-auto">
          <NavLink to="/" className="text-xl font-bold tracking-tighter text-[#4c6557]">
            Sanctum
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
          <div className="flex items-center gap-2 sm:gap-4">
            <QuickExitButton showIcon={quickExitIcon} />
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
