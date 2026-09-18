import { DEFAULT_DESTINATION_ID, isKnownDestination } from '@/features/quick-exit/destinations'
import { DEFAULT_SHORTCUT, validateShortcut, type Shortcut } from '@/features/quick-exit/shortcut'
import {
  CUSTOM_PRESET_ID,
  MAX_NAME_LENGTH,
  SANCTUM_PRESET_ID,
  presetById,
  type Disguise,
  type IconSpec,
} from '@/features/disguise/presets'

/**
 * Device-local preferences. These survive a quick exit on purpose: a disguise or shortcut that
 * resets every time it is used would be worse than none. They contain no conversation content.
 */
export interface Preferences {
  version: 1
  quickExit: {
    shortcut: Shortcut
    destinationId: string
    customUrl: string
    /** Also erase the server session (chats) on exit. */
    eraseOnExit: boolean
  }
  disguise: {
    presetId: string
    custom: Disguise | null
  }
  onboardingComplete: boolean
}

/** Neutral key name: nothing here should point at what the site is. */
export const STORAGE_KEY = 'app-preferences'

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  quickExit: {
    shortcut: DEFAULT_SHORTCUT,
    destinationId: DEFAULT_DESTINATION_ID,
    customUrl: '',
    eraseOnExit: true,
  },
  disguise: { presetId: SANCTUM_PRESET_ID, custom: null },
  onboardingComplete: false,
}

/** The disguise currently in effect. */
export function activeDisguise(prefs: Preferences): Disguise {
  const { presetId, custom } = prefs.disguise
  if (presetId === CUSTOM_PRESET_ID && custom) return custom
  return presetById(presetId) ?? presetById(SANCTUM_PRESET_ID)!
}

/**
 * Parses stored preferences. Anything malformed falls back to its default field by field, so a
 * corrupted or tampered value can never break the quick exit.
 */
export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return DEFAULT_PREFERENCES
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return DEFAULT_PREFERENCES
  }
  if (!isObject(data)) return DEFAULT_PREFERENCES
  const qe = isObject(data.quickExit) ? data.quickExit : {}
  const dg = isObject(data.disguise) ? data.disguise : {}

  const shortcut = parseShortcut(qe.shortcut)
  const destinationId =
    typeof qe.destinationId === 'string' && isKnownDestination(qe.destinationId)
      ? qe.destinationId
      : DEFAULT_DESTINATION_ID
  const custom = parseDisguise(dg.custom)
  const presetId =
    typeof dg.presetId === 'string' &&
    (presetById(dg.presetId) || (dg.presetId === CUSTOM_PRESET_ID && custom))
      ? dg.presetId
      : SANCTUM_PRESET_ID

  return {
    version: 1,
    quickExit: {
      shortcut,
      destinationId,
      customUrl: typeof qe.customUrl === 'string' ? qe.customUrl.slice(0, 500) : '',
      eraseOnExit: typeof qe.eraseOnExit === 'boolean' ? qe.eraseOnExit : true,
    },
    disguise: { presetId, custom },
    onboardingComplete: data.onboardingComplete === true,
  }
}

export function loadPreferences(storage: Storage | undefined = safeLocalStorage()): Preferences {
  try {
    return parsePreferences(storage?.getItem(STORAGE_KEY) ?? null)
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(prefs: Preferences, storage: Storage | undefined = safeLocalStorage()): boolean {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(prefs))
    return true
  } catch {
    // Private mode or a full quota: preferences then last for this page view only.
    return false
  }
}

function parseShortcut(value: unknown): Shortcut {
  if (!isObject(value) || typeof value.code !== 'string') return DEFAULT_SHORTCUT
  const presses = value.presses === 1 || value.presses === 2 || value.presses === 3 ? value.presses : 1
  const shortcut: Shortcut = {
    code: value.code,
    ctrl: value.ctrl === true,
    alt: value.alt === true,
    shift: value.shift === true,
    meta: value.meta === true,
    presses,
  }
  return validateShortcut(shortcut) ? DEFAULT_SHORTCUT : shortcut
}

function parseDisguise(value: unknown): Disguise | null {
  if (!isObject(value) || typeof value.name !== 'string') return null
  const name = value.name.trim().slice(0, MAX_NAME_LENGTH)
  const icon = parseIcon(value.icon)
  if (!name || !icon) return null
  return { name, icon }
}

function parseIcon(value: unknown): IconSpec | null {
  if (!isObject(value)) return null
  if (value.kind === 'image' && typeof value.dataUrl === 'string' && value.dataUrl.startsWith('data:image/png;base64,')) {
    return { kind: 'image', dataUrl: value.dataUrl }
  }
  if (
    value.kind === 'symbol' &&
    typeof value.symbol === 'string' && /^[a-z0-9_]{1,40}$/.test(value.symbol) &&
    isColor(value.background) && isColor(value.foreground)
  ) {
    return { kind: 'symbol', symbol: value.symbol, background: value.background, foreground: value.foreground }
  }
  return null
}

function isColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}
