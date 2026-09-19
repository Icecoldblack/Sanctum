import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/shared/Icon'
import { getLenis } from '@/hooks/useSmoothScroll'
import { useMediaQuery } from '@/hooks/usePlatform'
import { quickExit } from '@/features/quick-exit/quickExit'
import { calmAudio } from '@/features/breathing/calmAudio'
import { breathCue, hapticsAvailable, releaseHaptics, stopHaptics } from '@/features/breathing/haptics'
import {
  MIN_SCALE,
  PATTERNS,
  fullness,
  patternById,
  positionAt,
  scaleFor,
  type Pattern,
} from '@/features/breathing/patterns'
import { loadBreathingSettings, saveBreathingSettings, type BreathingSettings } from '@/features/breathing/settings'

interface Display {
  label: string
  remaining: number
  cycles: number
}

/**
 * Full-screen guided breathing. Mounted only while a session runs.
 *
 * The circle is animated by writing its transform straight from the clock on every frame, rather
 * than through React state or a fixed-length CSS transition: it stays smooth, never drifts, and
 * matches patterns whose phases differ in length. React re-renders only when the label or the
 * countdown changes, a few times a second.
 */
export function BreathingSession({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const [settings, setSettings] = useState<BreathingSettings>(loadBreathingSettings)
  const settingsRef = useRef(settings)
  const pattern = patternById(settings.patternId)
  const [display, setDisplay] = useState<Display>({ label: 'Get ready', remaining: 3, cycles: 0 })
  const circleRef = useRef<HTMLDivElement>(null)
  const finishRef = useRef<HTMLButtonElement>(null)
  const startedAt = useRef(0)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const canVibrate = hapticsAvailable()

  useEffect(() => {
    settingsRef.current = settings
    saveBreathingSettings(settings)
  }, [settings])

  // The breathing clock. Restarts, with its lead-in, whenever the pattern changes.
  useEffect(() => {
    startedAt.current = performance.now()
    let frame = 0
    let lastIndex = Number.NaN
    let lastRemaining = -1
    let lastCycles = -1

    const tick = (now: number) => {
      const position = positionAt(pattern, (now - startedAt.current) / 1000)
      const fill = fullness(position)
      const circle = circleRef.current
      if (circle) {
        if (reducedMotion) {
          circle.style.opacity = String(0.3 + 0.6 * fill)
        } else {
          circle.style.transform = `scale(${scaleFor(fill)})`
        }
      }

      if (position.index !== lastIndex) {
        lastIndex = position.index
        const phase = position.phase
        if (phase) {
          const left = phase.seconds * (1 - position.progress)
          if (settingsRef.current.sound) calmAudio.phase(phase.kind, left)
          if (settingsRef.current.haptics) breathCue(phase.kind)
        }
      }
      if (position.remaining !== lastRemaining || position.cycles !== lastCycles) {
        lastRemaining = position.remaining
        lastCycles = position.cycles
        setDisplay({ label: position.phase?.label ?? 'Get ready', remaining: position.remaining, cycles: position.cycles })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [pattern, reducedMotion])

  // Keep the screen awake while breathing, and rest the audio while the page is hidden.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    let active = true
    async function acquire() {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          const sentinel = await navigator.wakeLock.request('screen')
          if (active) lock = sentinel
          else void sentinel.release()
        }
      } catch {
        // Not supported, or refused (battery saver). The exercise works without it.
      }
    }
    function onVisibility() {
      if (document.visibilityState === 'visible') {
        void acquire()
        if (settingsRef.current.sound) calmAudio.resume()
      } else {
        calmAudio.suspend()
      }
    }
    void acquire()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisibility)
      void lock?.release().catch(() => {})
    }
  }, [])

  // Freeze the page behind, move focus in, and put everything back on the way out.
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    getLenis()?.stop()
    finishRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      getLenis()?.start()
      calmAudio.stop()
      stopHaptics()
      releaseHaptics()
      previousFocus?.focus?.()
    }
  }, [])

  function choosePattern(id: Pattern['id']) {
    setSettings((s) => ({ ...s, patternId: id }))
  }

  function toggleSound() {
    // Runs inside the tap, which is what lets audio start on iPhone.
    if (settings.sound) calmAudio.stop()
    else calmAudio.start()
    setSettings((s) => ({ ...s, sound: !s.sound }))
  }

  function toggleHaptics() {
    // A tap when turning it on confirms it works on this device.
    if (!settings.haptics) breathCue('hold-in')
    else stopHaptics()
    setSettings((s) => ({ ...s, haptics: !s.haptics }))
  }

  const summary =
    display.cycles === 0 ? pattern.summary : `${display.cycles} breath${display.cycles === 1 ? '' : 's'} · ${pattern.name}`

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-[#10252b] text-white">
      <img src="/images/therapy-ocean.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/70" />

      <header className="relative flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-6">
        <div>
          <p className="text-xs font-medium text-white/70">Visual Escape</p>
          <h2 id={titleId} className="text-lg font-bold">Ocean Breathing</h2>
        </div>
        <button
          type="button"
          onClick={quickExit}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-bold text-on-secondary shadow-lg"
        >
          <Icon name="logout" className="text-base" />
          Quick Exit
        </button>
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-6">
        <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
          {/* Where a full breath reaches. */}
          <div aria-hidden="true" className="absolute inset-0 rounded-full border border-white/25" />
          <div
            ref={circleRef}
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-white/20 shadow-[0_0_90px_rgba(255,255,255,0.25)] will-change-transform"
            style={reducedMotion ? { opacity: 0.3, transform: 'scale(0.85)' } : { transform: `scale(${MIN_SCALE})` }}
          />
          <div className="relative text-center">
            <p className="text-2xl font-bold drop-shadow">{display.label}</p>
            <p className="mt-1 text-5xl font-extralight tabular-nums drop-shadow" aria-hidden="true">
              {display.remaining}
            </p>
          </div>
        </div>
        <p className="mt-8 max-w-xs text-center text-sm text-white/85">{summary}</p>
        <p className="sr-only" aria-live="polite">
          {display.label}
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-md space-y-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div role="radiogroup" aria-label="Breathing pattern" className="grid grid-cols-3 gap-1 rounded-full bg-black/30 p-1">
          {PATTERNS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.id === pattern.id}
              onClick={() => choosePattern(p.id)}
              className={`min-h-10 rounded-full text-sm font-semibold transition-colors ${
                p.id === pattern.id ? 'bg-white text-[#10252b]' : 'text-white/85 hover:bg-white/10'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <ToggleButton on={settings.sound} onClick={toggleSound} iconOn="volume_up" iconOff="volume_off" label="Calm music" />
          {canVibrate && (
            <ToggleButton on={settings.haptics} onClick={toggleHaptics} iconOn="vibration" iconOff="mobile_off" label="Vibration" />
          )}
        </div>
        {settings.sound && (
          <p className="text-center text-[11px] text-white/70">Use headphones if someone nearby might hear.</p>
        )}

        <button
          ref={finishRef}
          type="button"
          onClick={onClose}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white/15 font-bold text-white transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <Icon name="check_circle" className="text-lg" />
          Finish
        </button>
      </div>
    </div>,
    document.body,
  )
}

function ToggleButton({ on, onClick, iconOn, iconOff, label }: { on: boolean; onClick: () => void; iconOn: string; iconOff: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors ${
        on ? 'bg-white text-[#10252b]' : 'bg-black/30 text-white/85 hover:bg-black/40'
      }`}
    >
      <Icon name={on ? iconOn : iconOff} className="text-lg" />
      {label}
      <span className="sr-only">{on ? 'on' : 'off'}</span>
    </button>
  )
}
