import { loadPreferences } from '@/features/preferences/preferences'
import { resolveExitUrl } from '@/features/quick-exit/destinations'

/** Must match SessionContext. */
const SESSION_KEY = 'sanctum_session_id'

/**
 * Same-origin entries pushed over this tab's history before leaving.
 *
 * `location.replace` only overwrites the entry the person is standing on. Every page they visited
 * before it (/sos, /therapy, whatever they were reading) is still behind it, so one press of Back
 * would bring it straight back onto the screen. Pushing decoy entries first buries those pages:
 * Back now walks through decoys instead. Ten covers far more navigation than a session realistically
 * accumulates.
 *
 * The decoys point at {@link EXIT_PATH}, which never renders the app: loading it sends the person
 * straight on to an exit site (see main.tsx). A decoy of `/` would show the home page.
 */
const DECOY_DEPTH = 10
/** Shown in the address bar while leaving, so it says nothing about leaving. Must match index.html. */
export const EXIT_PATH = '/start'

/**
 * Set by a quick exit, cleared by the next ordinary visit.
 *
 * Browsers never let a page delete history, and the decoys only cover the last {@link DECOY_DEPTH}
 * entries. Anything older still leads back to Sanctum. While this flag is set, any Sanctum page
 * reached through Back or Forward leaves again before rendering, so every entry behind the exit is
 * a dead end.
 *
 * The value is the exit site itself, so the inline script in index.html can leave without waiting
 * for the app bundle to load. Must match index.html.
 */
const EXITED_KEY = 'sanctum_exited'

/** Where the last quick exit went. Survives in a page restored from the back/forward cache. */
let exitedTo: string | null = null

/** Sends the person on to an exit site without rendering anything. Used by the decoy route. */
export function leaveToExitSite() {
  const prefs = loadPreferences()
  window.location.replace(resolveExitUrl(prefs.quickExit.destinationId, prefs.quickExit.customUrl))
}

/**
 * True when this page was reached with Back or Forward after a quick exit. Any other kind of visit
 * (typing the address, a bookmark, a reload) clears the flag, so Sanctum opens normally next time.
 */
export function returnedAfterExit(): boolean {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav?.type !== 'back_forward') {
      localStorage.removeItem(EXITED_KEY)
      return false
    }
    return localStorage.getItem(EXITED_KEY) !== null
  } catch {
    return false
  }
}

function exitFlagSet(): boolean {
  try {
    return localStorage.getItem(EXITED_KEY) !== null
  } catch {
    return false
  }
}

/**
 * Browsers can keep a page in the back/forward cache and restore it, exactly as it was, when Back
 * is pressed. If that happens after a quick exit, whether to the page just fled or an older one,
 * send them straight out again.
 */
function leaveAgainIfRestored(event: PageTransitionEvent) {
  if (!event.persisted) return
  if (exitedTo) window.location.replace(exitedTo)
  else if (exitFlagSet()) leaveToExitSite()
}
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', leaveAgainIfRestored)
  // Back pressed before the exit site finished loading moves between decoys in this same page.
  window.addEventListener('popstate', () => {
    if (exitedTo) window.location.replace(exitedTo)
  })
}

/**
 * Leaves immediately. Every step before the navigation is fire-and-forget, so nothing can delay it.
 *
 * - The server session (chats) is erased with a beacon, which the browser delivers even as the
 *   page unloads.
 * - This tab's session data is cleared. Preferences are kept on purpose, so the disguise and
 *   shortcut still work next time.
 * - Visited pages are buried under decoy history entries, then `location.replace` swaps the current
 *   entry for the destination.
 */
export function quickExit() {
  const prefs = loadPreferences()
  const destination = resolveExitUrl(prefs.quickExit.destinationId, prefs.quickExit.customUrl)

  try {
    const sessionId = localStorage.getItem(SESSION_KEY)
    if (prefs.quickExit.eraseOnExit && sessionId && !sessionId.startsWith('local-')) {
      eraseServerSession(sessionId)
    }
    localStorage.removeItem(SESSION_KEY)
    localStorage.setItem(EXITED_KEY, destination)
    sessionStorage.clear()
  } catch {
    // Storage can be unavailable (private mode). Leaving is still the priority.
  }

  exitedTo = destination

  // Blank the page first. Navigation takes a moment, and a page restored from the back/forward
  // cache comes back as it was left: empty rather than showing what the person was reading.
  try {
    document.body.replaceChildren()
  } catch {
    // Leaving still matters more.
  }

  // pushState never navigates, so nothing the person was reading flashes back up.
  try {
    for (let i = 0; i < DECOY_DEPTH; i += 1) {
      window.history.pushState(null, '', EXIT_PATH)
    }
  } catch {
    // pushState is rate-limited in some browsers; leaving still matters more.
  }

  // replace() consumes the last decoy rather than adding an entry of its own.
  window.location.replace(destination)
}

function eraseServerSession(sessionId: string) {
  const url = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/sessions/${encodeURIComponent(sessionId)}/erase`
  try {
    if (navigator.sendBeacon?.(url)) return
  } catch {
    // Fall through to fetch.
  }
  fetch(url, { method: 'POST', keepalive: true, mode: 'no-cors' }).catch(() => {})
}
