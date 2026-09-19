import { useRef } from 'react'
import { Icon } from '@/components/shared/Icon'
import { carriers, type Carrier } from '@/components/sos/carriers'

interface CarrierPickerProps {
  selectedId: string | null
  onSelect: (carrier: Carrier) => void
  /** A photo the user supplied, shown alongside the built-in carriers. */
  custom: Carrier | null
  onCustomSelect: (file: File) => void
  error?: string | null
}

export function CarrierPicker({
  selectedId,
  onSelect,
  custom,
  onCustomSelect,
  error,
}: CarrierPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
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
    </>
  )
}
