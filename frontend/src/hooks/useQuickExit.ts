import { useEffect, useRef } from 'react'

const EXIT_URL = 'https://www.google.com/search?q=weather'
const TRIPLE_TAP_WINDOW_MS = 1200
const REQUIRED_PRESSES = 3

export function quickExit() {
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    // Storage may be unavailable (private mode); exiting is still the priority.
  }
  window.location.replace(EXIT_URL)
}

export function useQuickExit() {
  const pressCount = useRef(0)
  const windowStart = useRef(0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      const now = Date.now()
      if (now - windowStart.current > TRIPLE_TAP_WINDOW_MS) {
        windowStart.current = now
        pressCount.current = 0
      }
      pressCount.current += 1

      if (pressCount.current >= REQUIRED_PRESSES) {
        quickExit()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
