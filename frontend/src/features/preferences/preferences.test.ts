import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PREFERENCES,
  STORAGE_KEY,
  activeDisguise,
  loadPreferences,
  parsePreferences,
  savePreferences,
  type Preferences,
} from '@/features/preferences/preferences'

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  }
}

const custom: Preferences = {
  ...DEFAULT_PREFERENCES,
  quickExit: {
    shortcut: { code: 'KeyQ', ctrl: false, alt: true, shift: false, meta: false, presses: 2 },
    destinationId: 'custom',
    customUrl: 'example.org',
    eraseOnExit: false,
  },
  disguise: {
    presetId: 'custom',
    custom: { name: 'Book Club', icon: { kind: 'symbol', symbol: 'menu_book', background: '#8b5cf6', foreground: '#ffffff' } },
  },
  onboardingComplete: true,
}

describe('preferences', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage()
    expect(savePreferences(custom, storage)).toBe(true)
    expect(loadPreferences(storage)).toEqual(custom)
    expect(storage.getItem(STORAGE_KEY)).not.toContain('sanctum')
  })

  it('returns defaults for missing or unreadable data', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(parsePreferences('not json')).toEqual(DEFAULT_PREFERENCES)
    expect(parsePreferences('[]')).toEqual(DEFAULT_PREFERENCES)
    expect(parsePreferences('42')).toEqual(DEFAULT_PREFERENCES)
  })

  it('repairs invalid fields individually instead of discarding everything', () => {
    const parsed = parsePreferences(
      JSON.stringify({
        ...custom,
        quickExit: { ...custom.quickExit, shortcut: { code: 'KeyQ', presses: 1 }, destinationId: 'evil' },
      }),
    )
    // A shortcut that would fire while typing falls back to the default.
    expect(parsed.quickExit.shortcut).toEqual(DEFAULT_PREFERENCES.quickExit.shortcut)
    expect(parsed.quickExit.destinationId).toBe('random')
    // Everything valid is kept.
    expect(parsed.disguise).toEqual(custom.disguise)
    expect(parsed.onboardingComplete).toBe(true)
  })

  it('rejects tampered disguise icons', () => {
    const bad = (icon: unknown) =>
      parsePreferences(JSON.stringify({ ...custom, disguise: { presetId: 'custom', custom: { name: 'X', icon } } }))
    expect(bad({ kind: 'image', dataUrl: 'javascript:alert(1)' }).disguise.presetId).toBe('sanctum')
    expect(bad({ kind: 'image', dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' }).disguise.custom).toBeNull()
    expect(bad({ kind: 'symbol', symbol: '<script>', background: '#fff', foreground: '#000' }).disguise.custom).toBeNull()
  })

  it('selects the active disguise', () => {
    expect(activeDisguise(DEFAULT_PREFERENCES).name).toBe('Sanctum')
    expect(activeDisguise({ ...DEFAULT_PREFERENCES, disguise: { presetId: 'weather', custom: null } }).name).toBe('Weather')
    expect(activeDisguise(custom).name).toBe('Book Club')
  })

  it('survives storage that throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('quota')
      },
    } as unknown as Storage
    expect(loadPreferences(throwing)).toEqual(DEFAULT_PREFERENCES)
    expect(savePreferences(custom, throwing)).toBe(false)
  })
})
