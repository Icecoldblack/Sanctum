import { useId, useRef, useState } from 'react'
import { Icon } from '@/components/shared/Icon'
import { carriers, type Carrier } from '@/components/sos/carriers'

interface CarrierPickerProps {
  selectedId: string | null
  onSelect: (carrier: Carrier) => void
  /** A photo the user supplied, shown alongside the built-in carriers. */
  custom: Carrier | null
  onCustomSelect: (file: File) => void
  error?: string | null
  /** Creates a new photo with AI. A blank scene means "surprise me". */
  onGenerate: (scene: string) => void
  generating: boolean
  generateError?: string | null
}

export function CarrierPicker({
  selectedId,
  onSelect,
  custom,
  onCustomSelect,
  error,
  onGenerate,
  generating,
  generateError,
}: CarrierPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const sceneId = useId()
  const [scene, setScene] = useState('')
  const options = custom ? [...carriers, custom] : carriers

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Choose a carrier image"
        className="grid grid-cols-2 gap-3 mb-6"
      >
        {options.map((carrier) => {
          const isSelected = carrier.id === selectedId
          return (
            <button
              key={carrier.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={carrier.label}
              onClick={() => onSelect(carrier)}
              className={`relative group cursor-pointer aspect-square rounded-xl overflow-hidden transition-all ${
                isSelected ? 'ring-4 ring-primary' : 'ring-0 ring-primary hover:ring-2'
              }`}
            >
              <img
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                src={carrier.src}
                alt={carrier.alt}
              />
              {isSelected && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <Icon name="check_circle" filled className="text-white" />
                </div>
              )}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Use your own photo as the carrier image"
          className="flex flex-col gap-1 items-center justify-center border-2 border-dashed border-outline-variant/30 rounded-xl aspect-square hover:bg-surface hover:border-primary/40 transition-colors cursor-pointer"
        >
          <Icon name="add_photo_alternate" className="text-outline-variant" />
          <span className="text-[10px] font-medium text-on-surface-variant px-2 text-center leading-tight">
            Your own photo
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onCustomSelect(file)
          // Reset so picking the same file twice still fires a change event.
          e.target.value = ''
        }}
      />

      {error && (
        <p role="alert" className="-mt-2 mb-4 text-xs font-medium text-error">
          {error}
        </p>
      )}

      <form
        className="mb-6 rounded-2xl bg-surface-container p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!generating) onGenerate(scene)
        }}
      >
        <label htmlFor={sceneId} className="flex items-center gap-2 text-sm font-bold text-on-surface">
          <Icon name="auto_awesome" className="text-base text-primary" />
          Or create a new photo with AI
        </label>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            id={sceneId}
            type="text"
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            maxLength={300}
            disabled={generating}
            autoComplete="off"
            placeholder="Describe a scene, e.g. a beach at sunset"
            className="min-h-11 min-w-0 flex-1 rounded-full border-none bg-surface-container-lowest px-4 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={generating}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-on-primary transition-opacity disabled:opacity-60"
          >
            <Icon name={generating ? 'hourglass_top' : scene.trim() ? 'image' : 'casino'} className="text-base" />
            {generating ? 'Creating…' : scene.trim() ? 'Create photo' : 'Surprise me'}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant" aria-live="polite">
          {generating
            ? 'Creating a natural-looking photo. This takes about 10 seconds.'
            : 'Leave it blank for a random everyday photo. Your message is never sent to the AI.'}
        </p>
        {generateError && (
          <p role="alert" className="mt-2 text-xs font-medium text-error">
            {generateError}
          </p>
        )}
      </form>
    </>
  )
}
