import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { activeDisguise } from '@/features/preferences/preferences'
import { applyDisguise } from '@/features/disguise/applyDisguise'
import { useQuickExitShortcut } from '@/features/quick-exit/useQuickExitShortcut'
import { OnboardingTour } from '@/features/onboarding/OnboardingTour'

export function Layout() {
  useQuickExitShortcut()
  useSmoothScroll()
  useDisguise()

  return (
    <div className="min-h-dvh bg-background">
      <Outlet />
      <OnboardingTour />
    </div>
  )
}

function useDisguise() {
  const { prefs } = usePreferences()
  const disguise = activeDisguise(prefs)
  useEffect(() => {
    applyDisguise(disguise).catch(() => {
      // Keep whatever is currently shown; the title was already set synchronously.
    })
  }, [disguise])
}
