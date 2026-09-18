export interface ExitDestination {
  id: string
  label: string
  url: string
}

/**
 * Everyday sites the quick exit can land on.
 *
 * What belongs here: destinations that are unremarkable on any shared device, plausible for anyone
 * regardless of who they are, and boring enough that a glance at them ends the conversation.
 * Deliberately excluded: anything about safety, health, legal help or relationships; anything
 * age-, gender- or interest-specific enough to read as out of character; and anything likely to be
 * blocked on a managed device, which would leave an error page instead of a cover story.
 *
 * These are landing pages rather than search URLs. A search puts the query in the address bar and
 * in the search engine's own history, where it persists on a signed-in account well after this
 * browser's history is cleared.
 */
export const EXIT_DESTINATIONS: readonly ExitDestination[] = [
  { id: 'weather', label: 'Weather.com', url: 'https://weather.com/' },
  { id: 'maps', label: 'Google Maps', url: 'https://www.google.com/maps' },
  { id: 'news', label: 'Google News', url: 'https://news.google.com/' },
  { id: 'wikipedia', label: 'Wikipedia', url: 'https://www.wikipedia.org/' },
  { id: 'recipes', label: 'Allrecipes', url: 'https://www.allrecipes.com/' },
  { id: 'sports', label: 'ESPN', url: 'https://www.espn.com/' },
  { id: 'finance', label: 'Yahoo Finance', url: 'https://finance.yahoo.com/' },
  { id: 'shopping', label: 'Amazon', url: 'https://www.amazon.com/' },
]

/**
 * Picks a different site from the list on every exit. Always landing on the same page is its own
 * tell: anyone scrolling the history sees one identical visit every time the app was closed.
 */
export const RANDOM_DESTINATION_ID = 'random'
export const CUSTOM_DESTINATION_ID = 'custom'
export const DEFAULT_DESTINATION_ID = RANDOM_DESTINATION_ID

/** Returns a normalized http(s) URL, or null if the input can't be used as an exit. */
export function normalizeExitUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null
  return url.toString()
}

export function isKnownDestination(id: string): boolean {
  return id === RANDOM_DESTINATION_ID || id === CUSTOM_DESTINATION_ID || EXIT_DESTINATIONS.some((d) => d.id === id)
}

export function resolveExitUrl(destinationId: string, customUrl: string, random: () => number = secureRandom): string {
  if (destinationId === CUSTOM_DESTINATION_ID) {
    const custom = normalizeExitUrl(customUrl)
    if (custom) return custom
  }
  const preset = EXIT_DESTINATIONS.find((d) => d.id === destinationId)
  if (preset) return preset.url
  // Random, or a custom address that isn't valid yet.
  const index = Math.floor(random() * EXIT_DESTINATIONS.length) % EXIT_DESTINATIONS.length
  return (EXIT_DESTINATIONS[index] ?? EXIT_DESTINATIONS[0]!).url
}

/** A number in [0, 1), from the crypto RNG where available (it needs a secure context). */
function secureRandom(): number {
  try {
    const buffer = new Uint32Array(1)
    crypto.getRandomValues(buffer)
    return (buffer[0] ?? 0) / 2 ** 32
  } catch {
    return Math.random()
  }
}
