import { Modal } from '@/components/shared/Modal'
import { Icon } from '@/components/shared/Icon'
import { hotlines } from '@/lib/hotlines'

interface CrisisNumbersProps {
  open: boolean
  onClose: () => void
}

export function CrisisNumbers({ open, onClose }: CrisisNumbersProps) {
  return (
    <Modal open={open} onClose={onClose} title="Crisis numbers">
      <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
        These lines are based in the United States. If you are elsewhere, search for your national
        domestic violence hotline — or call your local emergency number if you are in danger now.
      </p>
      <ul className="space-y-3">
        {hotlines.map(({ name, description, tel, display }) => (
          <li key={name}>
            <a
              href={tel}
              className="flex items-center gap-4 rounded-2xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container">
                <Icon name="call" className="text-primary text-lg" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-on-surface">{name}</h3>
                <p className="text-xs leading-relaxed text-on-surface-variant">{description}</p>
                <p className="mt-1 text-sm font-bold text-primary">{display}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs italic leading-relaxed text-on-surface-variant">
        Calls may appear on a shared phone bill. If that is a risk, the Crisis Text Line or a
        borrowed device may be safer.
      </p>
    </Modal>
  )
}
