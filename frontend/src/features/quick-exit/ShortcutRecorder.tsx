import { useEffect, useState } from 'react'
import { Icon } from '@/components/shared/Icon'
import { ShortcutKeys } from '@/components/shared/Kbd'
import { isMac } from '@/hooks/usePlatform'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import {
  DEFAULT_SHORTCUT,
  describeProblem,
  describeShortcut,
  shortcutFromEvent,
  validateShortcut,
  type Shortcut,
} from '@/features/quick-exit/shortcut'
import { suspendQuickExitShortcut } from '@/features/quick-exit/useQuickExitShortcut'

const MODIFIER_CODES = /^(Control|Alt|Shift|Meta|OS)(Left|Right)$/

/** Shows the current quick-exit shortcut and lets the person record a new one. */
export function ShortcutRecorder({ compact = false }: { compact?: boolean }) {
  const { prefs, update } = usePreferences()
  const current = prefs.quickExit.shortcut
  const [recording, setRecording] = useState(false)
  const [draft, setDraft] = useState<Shortcut | null>(null)
  const [presses, setPresses] = useState<Shortcut['presses']>(current.presses)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    if (!recording) return
    suspendQuickExitShortcut(true)
    function onKeyDown(event: KeyboardEvent) {
      // Swallow everything while recording, including Esc (which would close a dialog).
      event.preventDefault()
      event.stopPropagation()
      if (event.repeat || MODIFIER_CODES.test(event.code)) return
      const candidate = shortcutFromEvent(event, presses)
      const issue = validateShortcut(candidate)
      setDraft(candidate)
      setProblem(issue ? describeProblem(issue) : null)
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      suspendQuickExitShortcut(false)
    }
  }, [recording, presses])

  function start() {
    setDraft(null)
    setProblem(null)
    setPresses(current.presses)
    setRecording(true)
  }

  function save() {
    if (!draft || problem) return
    const next = { ...draft, presses }
    update((p) => ({ ...p, quickExit: { ...p.quickExit, shortcut: next } }))
    setRecording(false)
  }

  function reset() {
    update((p) => ({ ...p, quickExit: { ...p.quickExit, shortcut: DEFAULT_SHORTCUT } }))
    setRecording(false)
  }

  if (!recording) {
    return (
      <div className={`flex flex-wrap items-center gap-4 ${compact ? '' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <ShortcutKeys shortcut={current} size="lg" />
          <span className="sr-only">Current shortcut: {describeShortcut(current, isMac)}</span>
        </div>
        <button
          type="button"
          onClick={start}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant px-5 text-sm font-semibold text-primary hover:bg-primary-container/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon name="keyboard" className="text-lg" />
          Change shortcut
        </button>
      </div>
    )
  }

  const preview = draft ? { ...draft, presses } : null
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary-container/20 p-5">
      <p className="text-sm font-semibold text-on-surface" aria-live="polite">
        {preview ? 'New shortcut:' : 'Press the keys you want to use now…'}
      </p>
      <div className="mt-3 flex min-h-14 items-center">
        {preview ? (
          <ShortcutKeys shortcut={preview} size="lg" />
        ) : (
          <span className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Listening
          </span>
        )}
      </div>
      {problem && (
        <p role="alert" className="mt-2 text-sm font-medium text-error">
          {problem}
        </p>
      )}

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-on-surface">Press it</legend>
        <div className="mt-2 inline-flex rounded-full bg-surface-container p-1">
          {([1, 2, 3] as const).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={presses === n}
              onClick={() => setPresses(n)}
              className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
                presses === n ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              {n === 1 ? 'Once' : n === 2 ? 'Twice' : '3 times'}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          Pressing more than once makes accidental exits less likely.
        </p>
      </fieldset>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!draft || !!problem}
          className="min-h-11 rounded-full bg-primary px-6 text-sm font-bold text-on-primary disabled:opacity-40"
        >
          Save shortcut
        </button>
        <button
          type="button"
          onClick={() => setRecording(false)}
          className="min-h-11 rounded-full px-5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={reset}
          className="ml-auto min-h-11 rounded-full px-4 text-sm font-semibold text-on-surface-variant underline-offset-4 hover:underline"
        >
          Reset to Esc ×3
        </button>
      </div>
    </div>
  )
}
