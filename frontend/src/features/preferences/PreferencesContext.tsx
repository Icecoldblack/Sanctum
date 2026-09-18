import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { loadPreferences, savePreferences, type Preferences } from '@/features/preferences/preferences'

interface PreferencesContextValue {
  prefs: Preferences
  update: (change: (current: Preferences) => Preferences) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState(loadPreferences)

  const update = useCallback((change: (current: Preferences) => Preferences) => {
    setPrefs((current) => {
      const next = change(current)
      savePreferences(next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ prefs, update }), [prefs, update])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider')
  return ctx
}
