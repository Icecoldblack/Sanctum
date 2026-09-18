/**
 * A quick-exit keyboard shortcut: a key (by physical `code`, so Alt/Option combos work on every
 * layout), optional modifiers, and how many presses in a row trigger it.
 */
export interface Shortcut {
  code: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  presses: 1 | 2 | 3
}

export const DEFAULT_SHORTCUT: Shortcut = {
  code: 'Escape',
  ctrl: false,
  alt: false,
  shift: false,
  meta: false,
  presses: 3,
}

/** Presses of a repeated shortcut must land within this window. */
export const REPEAT_WINDOW_MS = 1200

const MODIFIER_CODES = new Set([
  'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight',
  'MetaLeft', 'MetaRight', 'OSLeft', 'OSRight', 'CapsLock', 'Fn', 'FnLock',
])

/** Keys that are safe on their own: they never type text, so they cannot fire mid-sentence. */
const STANDALONE_CODES = new Set([
  'Escape', 'Pause', 'ScrollLock', 'Insert',
  'F1', 'F2', 'F3', 'F4', 'F6', 'F7', 'F8', 'F9', 'F10',
])

/** Combos the browser keeps for itself; pages can never receive them. */
const BROWSER_RESERVED = new Set(['KeyW', 'KeyT', 'KeyN', 'KeyQ', 'Tab'])

export type ShortcutProblem =
  | 'modifier-only'
  | 'needs-modifier'
  | 'browser-reserved'
  | 'unsupported-key'

export function validateShortcut(s: Shortcut): ShortcutProblem | null {
  if (MODIFIER_CODES.has(s.code)) return 'modifier-only'
  if (s.code === 'F5' || s.code === 'F11' || s.code === 'F12') return 'browser-reserved'
  if ((s.ctrl || s.meta) && BROWSER_RESERVED.has(s.code)) return 'browser-reserved'
  const hasTypingSafeModifier = s.ctrl || s.alt || s.meta
  if (!hasTypingSafeModifier && !STANDALONE_CODES.has(s.code)) {
    // Letters, digits, Enter, Space and friends would trigger while someone is typing.
    return 'needs-modifier'
  }
  if (!isKnownCode(s.code)) return 'unsupported-key'
  return null
}

export function describeProblem(problem: ShortcutProblem): string {
  switch (problem) {
    case 'modifier-only':
      return 'Hold a modifier and press another key, for example Alt + Q.'
    case 'needs-modifier':
      return 'That key would trigger while you type. Add Ctrl or Alt, or use Esc or a function key.'
    case 'browser-reserved':
      return 'Your browser keeps that shortcut for itself. Choose a different one.'
    case 'unsupported-key':
      return "That key can't be used. Choose a letter, number, Esc, or a function key."
  }
}

export function shortcutFromEvent(
  event: Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>,
  presses: Shortcut['presses'],
): Shortcut {
  return {
    code: event.code,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
    presses,
  }
}

export function matchesKey(
  s: Shortcut,
  event: Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>,
): boolean {
  return (
    event.code === s.code &&
    event.ctrlKey === s.ctrl &&
    event.altKey === s.alt &&
    event.shiftKey === s.shift &&
    event.metaKey === s.meta
  )
}

/** Human-readable parts, e.g. ["Ctrl", "Shift", "E"]. */
export function shortcutKeys(s: Shortcut, isMac = false): string[] {
  const parts: string[] = []
  if (s.ctrl) parts.push(isMac ? '⌃' : 'Ctrl')
  if (s.alt) parts.push(isMac ? '⌥' : 'Alt')
  if (s.shift) parts.push(isMac ? '⇧' : 'Shift')
  if (s.meta) parts.push(isMac ? '⌘' : 'Win')
  parts.push(keyLabel(s.code))
  return parts
}

/** Short label for the hint next to the button, e.g. "Esc ×3" or "Alt+Q". */
export function formatShortcut(s: Shortcut, isMac = false): string {
  const combo = shortcutKeys(s, isMac).join(isMac ? '' : '+')
  return s.presses > 1 ? `${combo} ×${s.presses}` : combo
}

/** Sentence form for screen readers and instructions, e.g. "press Esc 3 times". */
export function describeShortcut(s: Shortcut, isMac = false): string {
  const combo = shortcutKeys(s, isMac).join(' + ')
  return s.presses > 1 ? `press ${combo} ${s.presses} times quickly` : `press ${combo}`
}

export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6)
  const named: Record<string, string> = {
    Escape: 'Esc', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']',
    Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
    Space: 'Space', Enter: 'Enter', Backspace: 'Backspace', Delete: 'Delete', Insert: 'Insert',
    Home: 'Home', End: 'End', PageUp: 'Page Up', PageDown: 'Page Down', Pause: 'Pause',
    ScrollLock: 'Scroll Lock', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  }
  return named[code] ?? code
}

function isKnownCode(code: string): boolean {
  return (
    /^Key[A-Z]$/.test(code) ||
    /^Digit[0-9]$/.test(code) ||
    /^Numpad[0-9]$/.test(code) ||
    /^F([1-9]|1[0-2])$/.test(code) ||
    keyLabel(code) !== code
  )
}

/**
 * Tracks consecutive presses of a shortcut. Returns true on the press that completes it.
 * Any other key resets the count, so "Esc, typing, Esc, Esc" does not trigger a triple.
 */
export class PressCounter {
  private count = 0
  private windowStart = 0
  private readonly now: () => number

  constructor(now: () => number = Date.now) {
    this.now = now
  }

  press(shortcut: Shortcut, event: Parameters<typeof matchesKey>[1]): boolean {
    if (!matchesKey(shortcut, event)) {
      if (!MODIFIER_CODES.has(event.code)) this.count = 0
      return false
    }
    const t = this.now()
    if (this.count === 0 || t - this.windowStart > REPEAT_WINDOW_MS) {
      this.count = 0
      this.windowStart = t
    }
    this.count += 1
    if (this.count >= shortcut.presses) {
      this.count = 0
      return true
    }
    return false
  }
}
