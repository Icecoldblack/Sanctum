import { useId } from 'react'
import { Icon } from '@/components/shared/Icon'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { AppIcon } from '@/features/disguise/AppIcon'
import { CUSTOM_PRESET_ID, DISGUISE_PRESETS } from '@/features/disguise/presets'

interface DisguisePickerProps {
  /** Show a "Make your own" tile that calls this. */
  onCustomize?: () => void
}

/** Grid of ready-made disguises. Choosing one applies it instantly to the tab. */
export function DisguisePicker({ onCustomize }: DisguisePickerProps) {
  const { prefs, update } = usePreferences()
  const selectedId = prefs.disguise.presetId
  const custom = prefs.disguise.custom
  const labelId = useId()

  function choose(id: string) {
    update((p) => ({ ...p, disguise: { ...p.disguise, presetId: id } }))
  }

  const tile = (selected: boolean) =>
    `relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
      selected
        ? 'border-primary bg-primary-container/30 text-on-surface ring-2 ring-primary'
        : 'border-outline-variant/40 text-on-surface-variant hover:border-outline-variant hover:bg-surface-container-low'
    }`

  return (
    <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      <span id={labelId} className="sr-only">
        Choose how this site appears
      </span>
      {DISGUISE_PRESETS.map((preset) => {
        const selected = selectedId === preset.id
        return (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => choose(preset.id)}
            className={tile(selected)}
          >
            <AppIcon icon={preset.icon} name={preset.name} size={40} />
            {preset.name}
            {selected && <Icon name="check_circle" filled className="absolute right-1.5 top-1.5 text-base text-primary" />}
          </button>
        )
      })}
      {custom && (
        <button
          type="button"
          role="radio"
          aria-checked={selectedId === CUSTOM_PRESET_ID}
          onClick={() => choose(CUSTOM_PRESET_ID)}
          className={tile(selectedId === CUSTOM_PRESET_ID)}
        >
          <AppIcon icon={custom.icon} name={custom.name} size={40} />
          <span className="line-clamp-1">{custom.name}</span>
          {selectedId === CUSTOM_PRESET_ID && (
            <Icon name="check_circle" filled className="absolute right-1.5 top-1.5 text-base text-primary" />
          )}
        </button>
      )}
      {onCustomize && (
        <button type="button" onClick={onCustomize} className={`${tile(false)} border-dashed`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-[22%] bg-surface-container">
            <Icon name={custom ? 'edit' : 'add'} className="text-primary" />
          </span>
          {custom ? 'Edit yours' : 'Make your own'}
        </button>
      )}
    </div>
  )
}
