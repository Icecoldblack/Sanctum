import { Icon } from '@/components/shared/Icon'
import { carriers, type Carrier } from '@/components/sos/carriers'

interface CarrierPickerProps {
  selectedId: string | null
  onSelect: (carrier: Carrier) => void
}

export function CarrierPicker({ selectedId, onSelect }: CarrierPickerProps) {
  return (
    <div role="radiogroup" aria-label="Choose a carrier image" className="grid grid-cols-2 gap-3 mb-6">
      {carriers.map((carrier) => {
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
      <div className="flex items-center justify-center border-2 border-dashed border-outline-variant/30 rounded-xl aspect-square hover:bg-surface transition-colors cursor-pointer">
        <Icon name="add_photo_alternate" className="text-outline-variant" />
      </div>
    </div>
  )
}
