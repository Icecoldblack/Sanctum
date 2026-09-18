import { useEffect, useRef } from 'react'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { quickExit } from '@/features/quick-exit/quickExit'
import { PressCounter } from '@/features/quick-exit/shortcut'

/** Set while the shortcut recorder is listening, so recording a shortcut never triggers an exit. */
let suspended = false

export function suspendQuickExitShortcut(value: boolean) {
  suspended = value
}

/**
 * Listens for the quick-exit shortcut everywhere on the page, including inside text fields: the
 * moment someone needs it is often mid-sentence. Uses the capture phase so no component can
 * swallow the key first.
 */
export function useQuickExitShortcut() {
  const { prefs } = usePreferences()
  const shortcut = prefs.quickExit.shortcut
  const counter = useRef(new PressCounter())

  useEffect(() => {
    counter.current = new PressCounter()
    function onKeyDown(event: KeyboardEvent) {
      if (suspended || event.repeat) return
      if (counter.current.press(shortcut, event)) {
        event.preventDefault()
        event.stopPropagation()
        quickExit()
      }
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [shortcut])
}
