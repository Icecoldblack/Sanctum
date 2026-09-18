import { useId, useRef, useState } from 'react'
import { Icon } from '@/components/shared/Icon'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { AppIcon } from '@/features/disguise/AppIcon'
import {
  CUSTOM_COLORS,
  CUSTOM_PRESET_ID,
  CUSTOM_SYMBOLS,
  MAX_NAME_LENGTH,
  type IconSpec,
} from '@/features/disguise/presets'
import { IconUploadError, imageFileToIcon } from '@/features/disguise/renderIcon'

interface CustomDisguiseEditorProps {
  onDone: () => void
}

type Mode = 'build' | 'upload'

/** Build a disguise from a symbol and color, or from your own picture, with a live preview. */
export function CustomDisguiseEditor({ onDone }: CustomDisguiseEditorProps) {
  const { prefs, update } = usePreferences()
  const existing = prefs.disguise.custom
  const [name, setName] = useState(existing?.name ?? '')
  const [mode, setMode] = useState<Mode>(existing?.icon.kind === 'image' ? 'upload' : 'build')
  const [symbol, setSymbol] = useState(existing?.icon.kind === 'symbol' ? existing.icon.symbol : 'menu_book')
  const [color, setColor] = useState(existing?.icon.kind === 'symbol' ? existing.icon.background : CUSTOM_COLORS[1]!)
  const [uploaded, setUploaded] = useState<string | null>(existing?.icon.kind === 'image' ? existing.icon.dataUrl : null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameId = useId()

  const icon: IconSpec | null =
    mode === 'upload'
      ? uploaded
        ? { kind: 'image', dataUrl: uploaded }
        : null
      : { kind: 'symbol', symbol, background: color, foreground: '#ffffff' }
  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && icon !== null

  async function onFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setUploadError(null)
    try {
      setUploaded(await imageFileToIcon(file))
    } catch (err) {
      setUploadError(err instanceof IconUploadError ? err.message : "That image couldn't be used.")
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function save() {
    if (!canSave || !icon) return
    update((p) => ({ ...p, disguise: { presetId: CUSTOM_PRESET_ID, custom: { name: trimmed, icon } } }))
    onDone()
  }

  return (
    <div className="space-y-6">
      {/* Live preview: what the tab and home screen will show. */}
      <div className="flex items-center gap-4 rounded-2xl bg-surface-container-low p-4">
        {icon ? (
          <AppIcon icon={icon} name={trimmed || '?'} size={56} />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-[22%] bg-surface-container-high">
            <Icon name="image" className="text-outline" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-on-surface">{trimmed || 'Your app name'}</p>
          <p className="text-xs text-on-surface-variant">Preview of your tab and home-screen icon</p>
        </div>
      </div>

      <div>
        <label htmlFor={nameId} className="font-semibold text-on-surface">
          Name
        </label>
        <input
          id={nameId}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
          maxLength={MAX_NAME_LENGTH}
          placeholder="e.g. Book Club"
          autoComplete="off"
          className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-right text-xs text-on-surface-variant">
          {name.length}/{MAX_NAME_LENGTH}
        </p>
      </div>

      <div>
        <div role="tablist" aria-label="Icon source" className="inline-flex rounded-full bg-surface-container p-1">
          {(['build', 'upload'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-9 rounded-full px-4 text-sm font-semibold ${
                mode === m ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              {m === 'build' ? 'Design an icon' : 'Use a picture'}
            </button>
          ))}
        </div>

        {mode === 'build' ? (
          <div className="mt-4 space-y-4">
            <fieldset>
              <legend className="text-sm font-semibold text-on-surface">Symbol</legend>
              <div className="mt-2 grid grid-cols-8 gap-1.5">
                {CUSTOM_SYMBOLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-label={s.replace(/_/g, ' ')}
                    aria-pressed={symbol === s}
                    onClick={() => setSymbol(s)}
                    className={`flex aspect-square items-center justify-center rounded-xl ${
                      symbol === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <Icon name={s} className="text-xl" />
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold text-on-surface">Color</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {CUSTOM_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    aria-pressed={color === c}
                    onClick={() => setColor(c)}
                    className={`h-9 w-9 rounded-full ring-offset-2 ${color === c ? 'ring-2 ring-primary' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        ) : (
          <div className="mt-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              id={`${nameId}-file`}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <label
              htmlFor={`${nameId}-file`}
              className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant/50 p-4 text-center text-sm text-on-surface-variant hover:bg-surface-container-low"
            >
              <Icon name="add_photo_alternate" className="text-2xl text-primary" />
              {busy ? 'Processing…' : uploaded ? 'Choose a different picture' : 'Choose a picture'}
              <span className="text-xs">It's cropped to a square. Location data in the photo is removed.</span>
            </label>
            {uploadError && (
              <p role="alert" className="mt-2 text-sm font-medium text-error">
                {uploadError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="min-h-11 rounded-full bg-primary px-6 text-sm font-bold text-on-primary disabled:opacity-40"
        >
          Use this disguise
        </button>
        <button type="button" onClick={onDone} className="min-h-11 rounded-full px-5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container">
          Cancel
        </button>
      </div>
    </div>
  )
}
