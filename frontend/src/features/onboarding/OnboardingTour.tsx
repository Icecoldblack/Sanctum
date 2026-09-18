import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '@/components/shared/Dialog'
import { Icon } from '@/components/shared/Icon'
import { ShortcutKeys } from '@/components/shared/Kbd'
import { isIOS, isStandalone, useHasFinePointer } from '@/hooks/usePlatform'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { CUSTOM_DESTINATION_ID, EXIT_DESTINATIONS, RANDOM_DESTINATION_ID, normalizeExitUrl } from '@/features/quick-exit/destinations'
import { ShortcutRecorder } from '@/features/quick-exit/ShortcutRecorder'
import { DisguisePicker } from '@/features/disguise/DisguisePicker'
import { InstallPanel } from '@/features/install/InstallPanel'
import { useInstallPrompt } from '@/features/install/installPrompt'
import { closeTour, useTourRequested } from '@/features/onboarding/tourStore'

type StepId = 'welcome' | 'exit' | 'disguise' | 'install' | 'choose'

interface Need {
  to: string
  icon: string
  title: string
  body: string
}

const NEEDS: readonly Need[] = [
  {
    to: '/sos',
    icon: 'emergency_home',
    title: 'Ask someone for help, secretly',
    body: 'Hide a message inside an ordinary photo and send it to someone you trust.',
  },
  {
    to: '/decode',
    icon: 'key',
    title: 'Read a hidden message',
    body: 'Someone sent you a photo from Sanctum? Open it here to see their message.',
  },
  {
    to: '/therapy',
    icon: 'psychology',
    title: 'Talk through how I feel',
    body: 'A calm, private chat that listens without judging. Available any time.',
  },
  {
    to: '/legal',
    icon: 'explore',
    title: 'Understand my legal options',
    body: 'Plain-language answers about protective orders, custody, housing, and more.',
  },
]

/**
 * The first-visit guide. Opens automatically until it is finished or skipped, and can be replayed
 * from the Guide button. Every step is optional; "Skip" is always one tap away.
 */
export function OnboardingTour() {
  const { prefs, update } = usePreferences()
  const requested = useTourRequested()
  const open = requested || !prefs.onboardingComplete
  const [index, setIndex] = useState(0)
  const navigate = useNavigate()
  const finePointer = useHasFinePointer()
  const { canPrompt } = useInstallPrompt()

  const showInstall = !isStandalone() && (canPrompt || isIOS() || !finePointer)
  const steps: StepId[] = ['welcome', 'exit', 'disguise', ...(showInstall ? (['install'] as const) : []), 'choose']
  const step = steps[Math.min(index, steps.length - 1)]!
  const isLast = index >= steps.length - 1

  function finish(to?: string) {
    update((p) => ({ ...p, onboardingComplete: true }))
    closeTour()
    setIndex(0)
    if (to) navigate(to)
  }

  const footer =
    step === 'choose' ? (
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setIndex(index - 1)} className="min-h-11 rounded-full px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container">
          Back
        </button>
        <button type="button" onClick={() => finish()} className="min-h-11 rounded-full px-4 text-sm font-semibold text-primary hover:bg-primary-container/40">
          Just look around
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-between gap-3">
        {index === 0 ? (
          <button type="button" onClick={() => finish()} className="min-h-11 rounded-full px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container">
            Skip guide
          </button>
        ) : (
          <button type="button" onClick={() => setIndex(index - 1)} className="min-h-11 rounded-full px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container">
            Back
          </button>
        )}
        <Progress count={steps.length} current={index} />
        <button
          type="button"
          onClick={() => setIndex(index + 1)}
          className="inline-flex min-h-11 items-center gap-1 rounded-full bg-primary px-6 text-sm font-bold text-on-primary shadow-md"
        >
          {index === 0 ? 'Show me' : 'Next'}
          <Icon name="arrow_forward" className="text-lg" />
        </button>
      </div>
    )

  return (
    <Dialog open={open} onClose={() => finish()} title={titles[step]} footer={footer} className="max-w-xl">
      <div key={step} className="animate-dialog-in pt-2">
        {step === 'welcome' && <Welcome />}
        {step === 'exit' && <QuickExitStep finePointer={finePointer} />}
        {step === 'disguise' && <DisguiseStep />}
        {step === 'install' && <InstallPanel />}
        {step === 'choose' && <ChooseStep onChoose={(to) => finish(to)} />}
        {isLast ? null : <span className="sr-only">Step {index + 1} of {steps.length}</span>}
      </div>
    </Dialog>
  )
}

const titles: Record<StepId, string> = {
  welcome: 'Welcome. You’re safe to look around.',
  exit: 'Leave in one second',
  disguise: 'Hide in plain sight',
  install: 'Keep it on your phone, disguised',
  choose: 'What do you need right now?',
}

function Welcome() {
  return (
    <div className="space-y-5">
      <p className="leading-relaxed text-on-surface-variant">
        Sanctum is a private place to get help if things at home don't feel safe. There's no account, and you
        never give your name.
      </p>
      <ul className="space-y-3">
        <Point icon="no_accounts">No sign-up, no email, no phone number.</Point>
        <Point icon="lock">Chats are stored encrypted and erased after a day without use, or immediately when you use Quick Exit.</Point>
        <Point icon="timer">This guide takes about a minute. You can skip it and reopen it from the Guide button.</Point>
      </ul>
    </div>
  )
}

function QuickExitStep({ finePointer }: { finePointer: boolean }) {
  const { prefs } = usePreferences()
  const { destinationId, customUrl } = prefs.quickExit
  const custom = destinationId === CUSTOM_DESTINATION_ID ? normalizeExitUrl(customUrl) : null
  const destination =
    destinationId === RANDOM_DESTINATION_ID || (destinationId === CUSTOM_DESTINATION_ID && !custom)
      ? 'an ordinary site like Weather.com or Wikipedia'
      : custom
        ? new URL(custom).hostname.replace(/^www\./, '')
        : (EXIT_DESTINATIONS.find((d) => d.id === destinationId)?.label ?? 'an ordinary site')
  return (
    <div className="space-y-5">
      <p className="leading-relaxed text-on-surface-variant">
        If someone walks in, tap <strong className="text-on-surface">Quick Exit</strong> at the top of every page. You'll land on{' '}
        <strong className="text-on-surface">{destination}</strong>, and your chats are erased.
      </p>
      <div className="flex items-center justify-center rounded-2xl bg-surface-container-low p-5">
        <span className="rounded-full bg-secondary px-5 py-2 text-sm font-bold text-on-secondary shadow-lg">Quick Exit</span>
      </div>
      {finePointer ? (
        <div className="space-y-3">
          <p className="font-semibold text-on-surface">Or use the keyboard</p>
          <ShortcutRecorder />
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">
          On a computer you can also use a keyboard shortcut, currently <ShortcutKeys shortcut={prefs.quickExit.shortcut} />.
        </p>
      )}
      <p className="text-sm text-on-surface-variant">You can change where it goes in Settings.</p>
    </div>
  )
}

function DisguiseStep() {
  const [hint, setHint] = useState(false)
  return (
    <div className="space-y-4">
      <p className="leading-relaxed text-on-surface-variant">
        Change what this tab is called and its icon, so a glance at your screen shows something ordinary. Try one,
        and watch your browser tab change.
      </p>
      <DisguisePicker onCustomize={() => setHint(true)} />
      {hint && (
        <p role="status" className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">
          You can design your own name and icon in <strong>Settings → Disguise</strong> after the guide.
        </p>
      )}
    </div>
  )
}

function ChooseStep({ onChoose }: { onChoose: (to: string) => void }) {
  return (
    <div className="grid gap-3">
      {NEEDS.map((need) => (
        <button
          key={need.to}
          type="button"
          onClick={() => onChoose(need.to)}
          className="group flex items-start gap-4 rounded-2xl border border-outline-variant/40 p-4 text-left transition-colors hover:border-primary hover:bg-primary-container/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
            <Icon name={need.icon} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-on-surface">{need.title}</span>
            <span className="mt-0.5 block text-sm leading-relaxed text-on-surface-variant">{need.body}</span>
          </span>
          <Icon name="chevron_right" className="self-center text-outline transition-transform group-hover:translate-x-1" />
        </button>
      ))}
      <p className="pt-1 text-center text-xs text-on-surface-variant">
        In danger right now? Call <a className="font-bold text-error underline" href="tel:911">911</a>.
      </p>
    </div>
  )
}

function Point({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
        <Icon name={icon} className="text-xl" />
      </span>
      <span className="pt-1.5 text-sm leading-relaxed text-on-surface">{children}</span>
    </li>
  )
}

function Progress({ count, current }: { count: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${i === current ? 'w-5 bg-primary' : 'w-1.5 bg-outline-variant'}`} />
      ))}
    </div>
  )
}
