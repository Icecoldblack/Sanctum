import { NavLink } from 'react-router-dom'
import { navItems } from '@/components/layout/nav-items'
import { Icon } from '@/components/shared/Icon'
import { HOTLINE_TEL } from '@/lib/hotlines'

type HelpVariant = 'button' | 'card' | 'advocate'

interface SidebarProps {
  helpVariant?: HelpVariant
}

export function Sidebar({ helpVariant = 'button' }: SidebarProps) {
  return (
    <aside className="hidden lg:flex h-screen w-64 fixed left-0 top-0 pt-20 bg-[#edefe8] flex-col gap-4 py-8 z-40">
      <div className="px-6 mb-6">
        <h2 className="text-lg font-bold text-[#4c6557] font-headline">Sanctuary</h2>
        <p className="text-xs text-on-surface-variant">Your safe space</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'text-[#4c6557] bg-[#ffffff] rounded-r-full py-3 px-6 mr-4 flex items-center gap-3 font-medium transition-all'
                : 'text-[#5c605a] py-3 px-6 flex items-center gap-3 hover:text-[#4c6557] hover:pl-8 transition-all duration-300 font-medium'
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
      </nav>

      {helpVariant === 'card' ? (
        <div className="mt-auto px-6 mb-8">
          <div className="p-4 bg-primary-container rounded-xl text-on-primary-container">
            <p className="text-xs font-bold mb-2">Need Help?</p>
            <p className="text-[10px] leading-relaxed opacity-80">
              Connect with a professional instantly.
            </p>
            <a
              href={HOTLINE_TEL}
              className="mt-3 w-full py-2 bg-primary text-on-primary rounded-full text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Icon name="call" className="text-sm" />
              Call Hotline
            </a>
          </div>
        </div>
      ) : helpVariant === 'advocate' ? (
        <div className="mt-auto px-6 pb-8">
          <a
            href={HOTLINE_TEL}
            className="w-full py-4 px-4 bg-primary text-on-primary rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-md hover:opacity-95 transition-opacity"
          >
            <span className="text-xs font-medium opacity-80 uppercase tracking-widest">
              Need Help?
            </span>
            <span className="text-sm">Speak to an advocate</span>
          </a>
        </div>
      ) : (
        <div className="mt-auto px-6">
          <a
            href={HOTLINE_TEL}
            className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm flex items-center justify-center gap-2"
          >
            <Icon name="call" className="text-sm" />
            Need Help?
          </a>
        </div>
      )}
    </aside>
  )
}
