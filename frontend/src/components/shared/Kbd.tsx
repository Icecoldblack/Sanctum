import { isMac } from '@/hooks/usePlatform'
import { shortcutKeys, type Shortcut } from '@/features/quick-exit/shortcut'

interface KbdProps {
  shortcut: Shortcut
  size?: 'sm' | 'lg'
  className?: string
}

/** Renders a shortcut as key caps, e.g. [Esc] ×3 or [Alt] + [Q]. Purely visual; pair with text. */
export function ShortcutKeys({ shortcut, size = 'sm', className = '' }: KbdProps) {
  const keys = shortcutKeys(shortcut, isMac)
  const cap =
    size === 'lg'
      ? 'min-w-12 rounded-xl px-3 py-2 text-lg border-b-4'
      : 'min-w-6 rounded-md px-1.5 py-0.5 text-[11px] border-b-2'
  return (
    <span aria-hidden="true" className={`inline-flex items-center gap-1 font-semibold text-on-surface-variant ${className}`}>
      {keys.map((key, i) => (
        <span key={`${key}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 && <span className={size === 'lg' ? 'text-base' : 'text-[10px]'}>+</span>}
          <kbd className={`inline-flex items-center justify-center border border-outline-variant/60 border-b-outline-variant bg-surface-container-lowest font-sans text-on-surface ${cap}`}>
            {key}
          </kbd>
        </span>
      ))}
      {shortcut.presses > 1 && (
        <span className={size === 'lg' ? 'ml-1 text-lg' : 'text-[11px]'}>×{shortcut.presses}</span>
      )}
    </span>
  )
}
