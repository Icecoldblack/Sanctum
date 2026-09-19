import { useState } from 'react'
import { Icon } from '@/components/shared/Icon'
import { BreathingSession } from '@/features/breathing/BreathingSession'
import { calmAudio } from '@/features/breathing/calmAudio'
import { patternById } from '@/features/breathing/patterns'
import { loadBreathingSettings } from '@/features/breathing/settings'

/** The Ocean Breathing card. Starting it opens a full-screen guided session. */
export function BreathingExercise() {
  const [open, setOpen] = useState(false)
  const [patternName, setPatternName] = useState(() => patternById(loadBreathingSettings().patternId).name)

  function start() {
    // Audio has to start inside the tap on iPhone, so it starts here rather than in the session.
    if (loadBreathingSettings().sound) calmAudio.start()
    setOpen(true)
  }

  function finish() {
    setOpen(false)
    setPatternName(patternById(loadBreathingSettings().patternId).name)
  }

  return (
    <>
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6">
        <p className="text-xs font-headline font-medium text-white/90">Visual Escape</p>
        <h4 className="text-lg font-bold text-white">Ocean Breathing</h4>
        <button
          type="button"
          onClick={start}
          className="mt-3 flex min-h-10 w-fit items-center gap-2 rounded-full bg-white/20 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/30"
        >
          <Icon name="play_circle" className="text-base" />
          Start breathing · {patternName}
        </button>
      </div>
      {open && <BreathingSession onClose={finish} />}
    </>
  )
}
