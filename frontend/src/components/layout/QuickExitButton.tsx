import { Icon } from '@/components/shared/Icon'
import { ShortcutKeys } from '@/components/shared/Kbd'
import { isMac, useHasFinePointer } from '@/hooks/usePlatform'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { quickExit } from '@/features/quick-exit/quickExit'
import { describeShortcut } from '@/features/quick-exit/shortcut'

interface QuickExitButtonProps {
  showIcon?: boolean
}

export function QuickExitButton({ showIcon = false }: QuickExitButtonProps) {
  const { prefs } = usePreferences()
  const shortcut = prefs.quickExit.shortcut
  // Keyboard hints only mean something where there is a keyboard.
  const showHint = useHasFinePointer()
  const spoken = describeShortcut(shortcut, isMac)

  return (
    <div className="flex items-center gap-2">
      {showHint && (
        <span className="hidden items-center gap-1.5 md:flex" title={`Quick exit shortcut: ${spoken}`}>
          <ShortcutKeys shortcut={shortcut} />
        </span>
      )}
      <button
        type="button"
        onClick={quickExit}
        aria-label={`Quick exit: leave this site now and erase your chats. Shortcut: ${spoken}.`}
        aria-keyshortcuts={shortcut.presses === 1 ? ariaKeys(shortcut) : undefined}
        className={
          showIcon
            ? 'bg-secondary text-on-secondary px-6 py-2 rounded-full font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center gap-2'
            : 'bg-secondary text-on-secondary px-5 py-2 rounded-full text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all'
        }
      >
        {showIcon && <Icon name="logout" className="text-sm" />}
        Quick Exit
      </button>
    </div>
  )
}

function ariaKeys(s: { code: string; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean }) {
  const key = s.code.replace(/^Key|^Digit/, '')
  return [s.ctrl && 'Control', s.alt && 'Alt', s.shift && 'Shift', s.meta && 'Meta', key].filter(Boolean).join('+')
}
