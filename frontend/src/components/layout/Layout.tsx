import { Outlet } from 'react-router-dom'
import { useQuickExit } from '@/hooks/useQuickExit'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'

export function Layout() {
  useQuickExit()
  useSmoothScroll()

  return (
    <div className="min-h-dvh bg-background">
      <Outlet />
    </div>
  )
}
