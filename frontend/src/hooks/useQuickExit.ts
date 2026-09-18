import { useEffect, useRef } from 'react'

const TRIPLE_TAP_WINDOW_MS = 1200
const REQUIRED_PRESSES = 3

/**
 * Where quick exit sends the user.
 *
 * Always landing on the same weather search is its own tell: anyone scrolling
 * the history sees one identical lookup every time the app is closed, which is
 * a pattern worth asking about. Picking from a pool makes each exit look like
 * an unrelated moment of ordinary browsing.
 *
 * What belongs here: destinations that are unremarkable on any shared device,
 * plausible for anyone regardless of who they are, and boring enough that a
 * glance at them ends the conversation. Deliberately excluded are anything
 * about safety, health, legal help or relationships; anything age-, gender- or
 * interest-specific enough to read as out of character; and anything likely to
 * be blocked on a managed device, which would leave an error page instead of a
 * cover story.
 *
 * These are landing pages rather than search URLs. A search puts the query in
 * the address bar and in the search engine's own history, where it persists on
 * a signed-in account well after this browser's history is cleared.
 */
const EXIT_URLS = [
  'https://weather.com',
  'https://www.google.com/maps',
  'https://news.google.com',
  'https://www.wikipedia.org',
  'https://www.allrecipes.com',
  'https://www.espn.com',
  'https://finance.yahoo.com',
  'https://www.amazon.com',
] as const

/** The destination used if anything below goes wrong; never leave the user here. */
const FALLBACK_EXIT_URL = EXIT_URLS[0]

/** Picks the destination, avoiding Math.random() for something safety-relevant. */
function pickExitUrl(): string {
  let index: number
  try {
    const buffer = new Uint32Array(1)
    crypto.getRandomValues(buffer)
    index = (buffer[0] ?? 0) % EXIT_URLS.length
  } catch {
    // getRandomValues needs a secure context; over plain HTTP it throws.
    index = Math.floor(Math.random() * EXIT_URLS.length)
  }
  return EXIT_URLS[index] ?? FALLBACK_EXIT_URL
}

/**
 * Entries pushed over the session's history before leaving.
 *
 * `location.replace` only overwrites the entry the user is standing on. Every
 * page they visited before it — /sos, /therapy, whatever they were reading —
 * is still behind them, so one press of Back brings it straight back onto the
 * screen. Pushing this many same-origin entries first buries those pages under
 * a run of harmless ones: Back now walks through decoys instead.
 *
 * These must be same-origin to be pushable, so they point at a page that looks
 * like nothing. Ten covers far more navigation than a session realistically
 * accumulates.
 */
const DECOY_DEPTH = 10
const DECOY_PATH = '/'

export function quickExit() {
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    // Storage may be unavailable (private mode); exiting is still the priority.
  }

  // Bury the visited pages. history.pushState never navigates, so the app does
  // not re-render and nothing the user was reading flashes back up.
  try {
    for (let i = 0; i < DECOY_DEPTH; i += 1) {
      window.history.pushState(null, '', DECOY_PATH)
    }
  } catch {
    // pushState is rate-limited in some browsers; leaving still matters more.
  }

  // replace() consumes the last decoy rather than adding an entry of its own,
  // so Back from the exit page lands on a decoy, not on Sanctum.
  window.location.replace(pickExitUrl())
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
