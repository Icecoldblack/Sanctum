import { useEffect, useState } from 'react'
import { Icon } from '@/components/shared/Icon'

interface Phase {
  label: string
  seconds: number
}

/** Box breathing: equal counts in, hold, out, hold. */
const PHASES: Phase[] = [
  { label: 'Breathe in', seconds: 4 },
  { label: 'Hold', seconds: 4 },
  { label: 'Breathe out', seconds: 4 },
  { label: 'Hold', seconds: 4 },
]

const CYCLE_SECONDS = PHASES.reduce((total, p) => total + p.seconds, 0)

/** Which phase a given second within a cycle falls into, and time left in it. */
function positionAt(elapsed: number): { phase: number; remaining: number; cycles: number } {
  const cycles = Math.floor(elapsed / CYCLE_SECONDS)
  let offset = elapsed % CYCLE_SECONDS
  for (let i = 0; i < PHASES.length; i += 1) {
    const seconds = PHASES[i]!.seconds
    if (offset < seconds) {
      return { phase: i, remaining: seconds - offset, cycles }
    }
    offset -= seconds
  }
  return { phase: 0, remaining: PHASES[0]!.seconds, cycles }
}

export function BreathingExercise() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // A single counter drives everything; phase and countdown are derived, so
  // there is no ref reading during render and no interleaved state updates.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed((prev) => prev + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  function toggle() {
    setElapsed(0)
    setRunning((prev) => !prev)
  }

  const { phase, remaining, cycles } = positionAt(elapsed)
  const current = PHASES[phase]!
  const inhaling = phase === 0 || phase === 1

  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6">
      {running && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div
            className={`h-28 w-28 rounded-full bg-white/25 backdrop-blur-sm transition-transform duration-[4000ms] ease-in-out ${
              inhaling ? 'scale-100' : 'scale-[0.55]'
            }`}
          />
        </div>
      )}

      <p className="relative text-xs font-headline font-medium text-white/90">Visual Escape</p>
      <h4 className="relative text-lg font-bold text-white">Ocean Breathing</h4>

      {running ? (
        <div className="relative mt-3 space-y-2">
          <p className="text-sm font-bold text-white" role="status" aria-live="polite">
            {current.label} · {remaining}
          </p>
          <p className="text-[10px] text-white/70">
            {cycles === 0 ? 'Follow the circle' : `${cycles} cycle${cycles === 1 ? '' : 's'} done`}
          </p>
          <button
            type="button"
            onClick={toggle}
            className="flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[10px] text-white backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <Icon name="stop_circle" className="text-xs" />
            Stop
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={toggle}
          className="relative mt-3 flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[10px] text-white backdrop-blur-md transition-colors hover:bg-white/30"
        >
          <Icon name="play_circle" className="text-xs" />
          Start breathing exercise
        </button>
      )}
    </div>
  )
}
