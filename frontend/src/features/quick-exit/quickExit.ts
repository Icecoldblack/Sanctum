import { loadPreferences } from '@/features/preferences/preferences'
import { resolveExitUrl } from '@/features/quick-exit/destinations'

/** Must match SessionContext. */
const SESSION_KEY = 'sanctum_session_id'

/**
 * Same-origin entries pushed over this tab's history before leaving.
 *
 * `location.replace` only overwrites the entry the person is standing on. Every page they visited
 * before it (/sos, /therapy, whatever they were reading) is still behind it, so one press of Back
 * would bring it straight back onto the screen. Pushing harmless entries first buries those pages:
 * Back now walks through decoys instead. Ten covers far more navigation than a session realistically
 * accumulates.
 */
const DECOY_DEPTH = 10
const DECOY_PATH = '/'

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
    sessionStorage.clear()
  } catch {
    // Storage can be unavailable (private mode). Leaving is still the priority.
  }

  // pushState never navigates, so nothing the person was reading flashes back up.
  try {
    for (let i = 0; i < DECOY_DEPTH; i += 1) {
      window.history.pushState(null, '', DECOY_PATH)
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
