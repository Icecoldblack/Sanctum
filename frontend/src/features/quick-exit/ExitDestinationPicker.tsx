import { useId, useState } from 'react'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import {
  CUSTOM_DESTINATION_ID,
  EXIT_DESTINATIONS,
  RANDOM_DESTINATION_ID,
  normalizeExitUrl,
} from '@/features/quick-exit/destinations'

/** Where the quick exit goes. Applies immediately; the custom URL applies once it is valid. */
export function ExitDestinationPicker() {
  const { prefs, update } = usePreferences()
  const { destinationId, customUrl } = prefs.quickExit
  const [draftUrl, setDraftUrl] = useState(customUrl)
  const groupId = useId()
  const urlId = useId()
  const urlInvalid = destinationId === CUSTOM_DESTINATION_ID && draftUrl.trim() !== '' && !normalizeExitUrl(draftUrl)

  function choose(id: string) {
    update((p) => ({ ...p, quickExit: { ...p.quickExit, destinationId: id } }))
  }

  function commitUrl(value: string) {
    setDraftUrl(value)
    const normalized = normalizeExitUrl(value)
    if (normalized || value.trim() === '') {
      update((p) => ({ ...p, quickExit: { ...p.quickExit, customUrl: value.trim() } }))
    }
  }

  const options = [
    { id: RANDOM_DESTINATION_ID, label: 'A different everyday site each time (recommended)', url: '' },
    ...EXIT_DESTINATIONS,
    { id: CUSTOM_DESTINATION_ID, label: 'A site I choose', url: '' },
  ]

  return (
    <fieldset>
      <legend id={groupId} className="font-semibold text-on-surface">
        Where it takes you
      </legend>
      <p className="mt-1 text-sm text-on-surface-variant">
        Pick somewhere ordinary for you. The pages you visited here are hidden behind harmless ones, so
        pressing Back won't bring them up.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = destinationId === option.id
          return (
            <label
              key={option.id}
              className={`${option.id === RANDOM_DESTINATION_ID ? 'sm:col-span-2 ' : ''}flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                selected ? 'border-primary bg-primary-container/30 font-semibold' : 'border-outline-variant/40 hover:bg-surface-container-low'
              }`}
            >
              <input
                type="radio"
                name={groupId}
                value={option.id}
                checked={selected}
                onChange={() => choose(option.id)}
                className="h-4 w-4 accent-[#4c6557]"
              />
              {option.label}
            </label>
          )
        })}
      </div>
      {destinationId === CUSTOM_DESTINATION_ID && (
        <div className="mt-3">
          <label htmlFor={urlId} className="text-sm font-semibold text-on-surface">
            Website address
          </label>
          <input
            id={urlId}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. bbc.com/weather"
            value={draftUrl}
            onChange={(e) => commitUrl(e.target.value)}
            aria-invalid={urlInvalid}
            aria-describedby={`${urlId}-help`}
            className="mt-1 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p id={`${urlId}-help`} className={`mt-1 text-xs ${urlInvalid ? 'font-medium text-error' : 'text-on-surface-variant'}`}>
            {urlInvalid
              ? "That doesn't look like a website address. Until it's fixed, a random everyday site is used."
              : 'Until you enter an address, a random everyday site is used.'}
          </p>
        </div>
      )}
    </fieldset>
  )
}
