export type PhaseKind = 'inhale' | 'hold-in' | 'exhale' | 'hold-out'

export interface Phase {
  kind: PhaseKind
  label: string
  seconds: number
}

export interface Pattern {
  id: 'calm' | 'box' | '478'
  name: string
  summary: string
  phases: Phase[]
}

const inhale = (seconds: number): Phase => ({ kind: 'inhale', label: 'Breathe in', seconds })
const exhale = (seconds: number): Phase => ({ kind: 'exhale', label: 'Breathe out', seconds })
const holdIn = (seconds: number): Phase => ({ kind: 'hold-in', label: 'Hold', seconds })
const holdOut = (seconds: number): Phase => ({ kind: 'hold-out', label: 'Hold', seconds })

/**
 * Calm is the default: slow breathing around six breaths a minute with an exhale longer than the
 * inhale is the most consistently calming pattern in the research, and needs no breath-holding,
 * which can feel uncomfortable when someone is already anxious.
 */
export const PATTERNS: Pattern[] = [
  { id: 'calm', name: 'Calm', summary: 'In 4, out 6. A longer breath out helps your body settle.', phases: [inhale(4), exhale(6)] },
  { id: 'box', name: 'Box', summary: 'In 4, hold 4, out 4, hold 4. Steady and focusing.', phases: [inhale(4), holdIn(4), exhale(4), holdOut(4)] },
  { id: '478', name: '4-7-8', summary: 'In 4, hold 7, out 8. Slower, good for winding down.', phases: [inhale(4), holdIn(7), exhale(8)] },
]

export const DEFAULT_PATTERN_ID: Pattern['id'] = 'calm'

export function patternById(id: string): Pattern {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0]!
}

export function cycleSeconds(pattern: Pattern): number {
  return pattern.phases.reduce((total, p) => total + p.seconds, 0)
}

/** Seconds of "get ready" before the first breath, with the circle at rest. */
export const LEAD_IN_SECONDS = 3

export interface Position {
  /** -1 during the lead-in. */
  index: number
  phase: Phase | null
  /** 0..1 through the current phase (or lead-in). */
  progress: number
  /** Whole seconds left in the current phase, for the countdown. */
  remaining: number
  /** Completed breaths. */
  cycles: number
}

/** Where a session is after `elapsed` seconds, counting the lead-in. */
export function positionAt(pattern: Pattern, elapsed: number): Position {
  if (elapsed < LEAD_IN_SECONDS) {
    return {
      index: -1,
      phase: null,
      progress: Math.max(0, elapsed) / LEAD_IN_SECONDS,
      remaining: Math.ceil(LEAD_IN_SECONDS - Math.max(0, elapsed)),
      cycles: 0,
    }
  }
  const t = elapsed - LEAD_IN_SECONDS
  const total = cycleSeconds(pattern)
  const cycles = Math.floor(t / total)
  let offset = t - cycles * total
  for (let i = 0; i < pattern.phases.length; i += 1) {
    const phase = pattern.phases[i]!
    if (offset < phase.seconds) {
      return { index: i, phase, progress: offset / phase.seconds, remaining: Math.ceil(phase.seconds - offset), cycles }
    }
    offset -= phase.seconds
  }
  const first = pattern.phases[0]!
  return { index: 0, phase: first, progress: 0, remaining: first.seconds, cycles: cycles + 1 }
}

export const MIN_SCALE = 0.5
export const MAX_SCALE = 1

/** Gentle ease-in-out, so the circle starts and settles softly like a real breath. */
function ease(t: number): number {
  return (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t)))) / 2
}

/** How full the breath is (0 = empty, 1 = full), which drives the circle, sound and light. */
export function fullness(position: Position): number {
  switch (position.phase?.kind) {
    case 'inhale':
      return ease(position.progress)
    case 'hold-in':
      return 1
    case 'exhale':
      return 1 - ease(position.progress)
    default:
      return 0
  }
}

export function scaleFor(fill: number): number {
  return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * fill
}
