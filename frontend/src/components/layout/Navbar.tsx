import { NavLink } from 'react-router-dom'
import { navItems } from '@/components/layout/nav-items'
import { QuickExitButton } from '@/components/layout/QuickExitButton'

interface NavbarProps {
  quickExitIcon?: boolean
}

export function Navbar({ quickExitIcon = false }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#fafaf5]/80 backdrop-blur-md shadow-sm opacity-6 shadow-[#2f342e]">
      <div className="flex justify-between items-center px-6 py-3 w-full max-w-screen-2xl mx-auto">
        <NavLink to="/" className="text-xl font-bold tracking-tighter text-[#4c6557]">
          Sanctum
        </NavLink>
        <div className="hidden md:flex gap-8 items-center font-body text-sm tracking-tight">
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
        <div className="flex items-center gap-4">
          <QuickExitButton showIcon={quickExitIcon} />
        </div>
      </div>
    </nav>
  )
}
