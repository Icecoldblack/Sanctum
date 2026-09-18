import { Outlet } from 'react-router-dom'
import { useQuickExit } from '@/hooks/useQuickExit'

export function Layout() {
  useQuickExit()

  return (
    <div className="min-h-dvh bg-background">
      <Outlet />
    </div>
  )
}
