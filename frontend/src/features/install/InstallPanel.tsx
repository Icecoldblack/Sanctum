import { useState, type ReactNode } from 'react'
import { Icon } from '@/components/shared/Icon'
import { isIOS, isStandalone } from '@/hooks/usePlatform'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { activeDisguise } from '@/features/preferences/preferences'
import { AppIcon } from '@/features/disguise/AppIcon'
import { promptInstall, useInstallPrompt } from '@/features/install/installPrompt'

/**
 * "Add to home screen", using the current disguise's name and icon. Android/desktop Chrome and
 * Edge get the native prompt; iOS Safari has no prompt API, so it gets step-by-step instructions.
 */
export function InstallPanel() {
  const { prefs } = usePreferences()
  const disguise = activeDisguise(prefs)
  const { canPrompt, installed } = useInstallPrompt()
  const [result, setResult] = useState<string | null>(null)
  const ios = isIOS()

  async function install() {
    const outcome = await promptInstall()
    setResult(
      outcome === 'accepted'
        ? `Added. Look for "${disguise.name}" on your home screen.`
        : outcome === 'dismissed'
          ? 'Not added. You can do this any time.'
          : null,
    )
  }

  const preview = (
    <div className="flex items-center gap-4 rounded-2xl bg-surface-container-low p-4">
      <AppIcon icon={disguise.icon} name={disguise.name} size={56} />
      <div>
        <p className="font-semibold text-on-surface">{disguise.name}</p>
        <p className="text-xs text-on-surface-variant">How it will appear on your home screen</p>
      </div>
    </div>
  )

  if (isStandalone() || installed) {
    return (
      <div className="space-y-3">
        {preview}
        <p className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Icon name="check_circle" filled className="text-primary" />
          {installed ? `Added as "${disguise.name}".` : "You're using the home-screen app."} To change its name or icon,
          remove it from your home screen, pick a new disguise, then add it again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {preview}
      {canPrompt ? (
        <button
          type="button"
          onClick={install}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 font-bold text-on-primary shadow-md"
        >
          <Icon name="add_to_home_screen" />
          Add to home screen
        </button>
      ) : ios ? (
        <ol className="space-y-3 text-sm text-on-surface">
          <Step n={1}>
            Tap the <strong>Share</strong> button <Icon name="ios_share" className="align-middle text-base" /> in Safari's toolbar.
          </Step>
          <Step n={2}>
            Scroll and tap <strong>Add to Home Screen</strong>.
          </Step>
          <Step n={3}>
            The name will already say <strong>{disguise.name}</strong>. Tap <strong>Add</strong>.
          </Step>
        </ol>
      ) : (
        <p className="text-sm leading-relaxed text-on-surface-variant">
          Open your browser's menu <Icon name="more_vert" className="align-middle text-base" /> and choose{' '}
          <strong>Install app</strong> or <strong>Add to Home screen</strong>. On a phone, this works best in Chrome
          (Android) or Safari (iPhone).
        </p>
      )}
      {result && (
        <p role="status" className="text-sm font-medium text-primary">
          {result}
        </p>
      )}
      <p className="text-xs leading-relaxed text-on-surface-variant">
        Choose your disguise first. Most phones keep the name and icon from the moment you add it.
      </p>
    </div>
  )
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  )
}
