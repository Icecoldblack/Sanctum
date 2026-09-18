import { NavLink } from 'react-router-dom'
import { navItems } from '@/components/layout/nav-items'
import { Icon } from '@/components/shared/Icon'

export function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 w-full bg-surface-container border-t-0 py-3 px-6 flex justify-around items-center z-50">
      {navItems.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} className="flex flex-col items-center gap-1">
          {({ isActive }) => (
            <>
              <Icon
                name={icon}
                filled={isActive}
                className={isActive ? 'text-primary' : 'text-on-surface-variant'}
              />
              <span
                className={`text-[10px] ${isActive ? 'font-bold text-primary' : 'font-medium text-on-surface-variant'}`}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
