import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SHORTCUT,
  PressCounter,
  REPEAT_WINDOW_MS,
  describeShortcut,
  formatShortcut,
  validateShortcut,
  type Shortcut,
} from '@/features/quick-exit/shortcut'

const key = (code: string, mods: Partial<Record<'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey', boolean>> = {}) => ({
  code,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...mods,
})

const combo = (code: string, mods: Partial<Shortcut> = {}): Shortcut => ({
  code,
  ctrl: false,
  alt: false,
  shift: false,
  meta: false,
  presses: 1,
  ...mods,
})

describe('validateShortcut', () => {
  it('accepts safe shortcuts', () => {
    expect(validateShortcut(DEFAULT_SHORTCUT)).toBeNull()
    expect(validateShortcut(combo('KeyQ', { alt: true }))).toBeNull()
    expect(validateShortcut(combo('KeyE', { ctrl: true, shift: true }))).toBeNull()
    expect(validateShortcut(combo('F2'))).toBeNull()
    expect(validateShortcut(combo('Digit9', { alt: true }))).toBeNull()
  })

  it('rejects keys that would fire while typing', () => {
    expect(validateShortcut(combo('KeyQ'))).toBe('needs-modifier')
    expect(validateShortcut(combo('KeyQ', { shift: true }))).toBe('needs-modifier')
    expect(validateShortcut(combo('Space'))).toBe('needs-modifier')
    expect(validateShortcut(combo('Enter'))).toBe('needs-modifier')
  })

  it('rejects modifier-only and browser-reserved shortcuts', () => {
    expect(validateShortcut(combo('ShiftLeft', { shift: true }))).toBe('modifier-only')
    expect(validateShortcut(combo('KeyW', { ctrl: true }))).toBe('browser-reserved')
    expect(validateShortcut(combo('KeyT', { meta: true }))).toBe('browser-reserved')
    expect(validateShortcut(combo('F5'))).toBe('browser-reserved')
  })

  it('rejects unknown keys', () => {
    expect(validateShortcut(combo('IntlRo', { alt: true }))).toBe('unsupported-key')
  })
})

describe('formatting', () => {
  it('formats compact hints and spoken descriptions', () => {
    expect(formatShortcut(DEFAULT_SHORTCUT)).toBe('Esc ×3')
    expect(formatShortcut(combo('KeyQ', { ctrl: true, alt: true }))).toBe('Ctrl+Alt+Q')
    expect(formatShortcut(combo('KeyQ', { alt: true }), true)).toBe('⌥Q')
    expect(describeShortcut(DEFAULT_SHORTCUT)).toBe('press Esc 3 times quickly')
    expect(describeShortcut(combo('Digit1', { alt: true }))).toBe('press Alt + 1')
  })
})

describe('PressCounter', () => {
  function counterAt(times: number[]) {
    let i = 0
    return new PressCounter(() => times[i++] ?? 0)
  }

  it('fires a single-press shortcut immediately, only with exact modifiers', () => {
    const s = combo('KeyQ', { alt: true })
    const c = new PressCounter(() => 0)
    expect(c.press(s, key('KeyQ'))).toBe(false)
    expect(c.press(s, key('KeyQ', { altKey: true, shiftKey: true }))).toBe(false)
    expect(c.press(s, key('KeyQ', { altKey: true }))).toBe(true)
  })

  it('fires a triple press within the window', () => {
    const c = counterAt([0, 300, 600])
    expect(c.press(DEFAULT_SHORTCUT, key('Escape'))).toBe(false)
    expect(c.press(DEFAULT_SHORTCUT, key('Escape'))).toBe(false)
    expect(c.press(DEFAULT_SHORTCUT, key('Escape'))).toBe(true)
  })

  it('does not fire when presses are too slow', () => {
    const c = counterAt([0, 600, REPEAT_WINDOW_MS + 100, REPEAT_WINDOW_MS + 200])
    expect(c.press(DEFAULT_SHORTCUT, key('Escape'))).toBe(false)
    expect(c.press(DEFAULT_SHORTCUT, key('Escape'))).toBe(false)
    // Window expired: this starts a new sequence.
    expect(c.press(DEFAULT_SHORTCUT, key('Escape'))).toBe(false)
    expect(c.press(DEFAULT_SHORTCUT, key('Escape'))).toBe(false)
  })

  it('resets when another key is pressed in between', () => {
    const c = new PressCounter(() => 0)
    c.press(DEFAULT_SHORTCUT, key('Escape'))
    c.press(DEFAULT_SHORTCUT, key('Escape'))
    c.press(DEFAULT_SHORTCUT, key('KeyA'))
    expect(c.press(DEFAULT_SHORTCUT, key('Escape'))).toBe(false)
  })

  it('ignores lone modifier presses between repeats', () => {
    const s = combo('KeyQ', { alt: true, presses: 2 })
    const c = new PressCounter(() => 0)
    expect(c.press(s, key('KeyQ', { altKey: true }))).toBe(false)
    expect(c.press(s, key('AltLeft', { altKey: true }))).toBe(false)
    expect(c.press(s, key('KeyQ', { altKey: true }))).toBe(true)
  })

  it('starts over after firing', () => {
    const c = new PressCounter(() => 0)
    const s = combo('Escape', { presses: 2 })
    c.press(s, key('Escape'))
    expect(c.press(s, key('Escape'))).toBe(true)
    expect(c.press(s, key('Escape'))).toBe(false)
  })
})
