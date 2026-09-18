import { quickExit } from '@/hooks/useQuickExit'
import { Icon } from '@/components/shared/Icon'

interface QuickExitButtonProps {
  showIcon?: boolean
}

export function QuickExitButton({ showIcon = false }: QuickExitButtonProps) {
  return (
    <button
      type="button"
      onClick={quickExit}
      aria-label="Quick exit — leave this site immediately and clear local data"
      className={
        showIcon
          ? 'bg-secondary text-on-secondary px-6 py-2 rounded-full font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2'
          : 'bg-secondary text-on-secondary px-5 py-2 rounded-full text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all'
      }
    >
      {showIcon && <Icon name="logout" className="text-sm" />}
      Quick Exit
    </button>
  )
}
