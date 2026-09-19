import { DEFAULT_PATTERN_ID, PATTERNS, type Pattern } from '@/features/breathing/patterns'

export interface BreathingSettings {
  patternId: Pattern['id']
  /**
   * Off until turned on. Sound can be overheard, and this app is used by people who may be
   * monitored, so it never plays unexpectedly. Once turned on, it stays on for next time.
   */
  sound: boolean
  haptics: boolean
}

/** Neutral key name: nothing here should point at what the site is. */
const KEY = 'app-breathing'

const DEFAULTS: BreathingSettings = { patternId: DEFAULT_PATTERN_ID, sound: false, haptics: true }

export function loadBreathingSettings(): BreathingSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<BreathingSettings> | null
    if (!raw || typeof raw !== 'object') return DEFAULTS
    return {
      patternId: PATTERNS.some((p) => p.id === raw.patternId) ? raw.patternId! : DEFAULTS.patternId,
      sound: raw.sound === true,
      haptics: raw.haptics !== false,
    }
  } catch {
    return DEFAULTS
  }
}

export function saveBreathingSettings(settings: BreathingSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Private mode: settings last for this visit only.
  }
}
