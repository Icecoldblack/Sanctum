import { useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

/**
 * Chrome and Edge fire `beforeinstallprompt` once, early. Capture it at module load, before React
 * renders, and keep it until the person taps "Add to home screen".
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    notify()
  })
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

export async function promptInstall(): Promise<InstallOutcome> {
  const event = deferred
  if (!event) return 'unavailable'
  deferred = null
  notify()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}

interface InstallState {
  canPrompt: boolean
  installed: boolean
}

let snapshot: InstallState = { canPrompt: false, installed: false }

function getSnapshot(): InstallState {
  const next = { canPrompt: deferred !== null, installed }
  if (next.canPrompt !== snapshot.canPrompt || next.installed !== snapshot.installed) snapshot = next
  return snapshot
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useInstallPrompt(): InstallState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
