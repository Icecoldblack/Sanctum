import { useSyncExternalStore } from 'react'

let open = false
const listeners = new Set<() => void>()

function set(value: boolean) {
  open = value
  listeners.forEach((l) => l())
}

export const openTour = () => set(true)
export const closeTour = () => set(false)

/** Whether the guide was opened on request (first-visit opening is driven by preferences). */
export function useTourRequested(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => open,
    () => false,
  )
}
