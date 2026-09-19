import { WebHaptics } from 'web-haptics'
import { isIOS } from '@/hooks/usePlatform'
import type { PhaseKind } from '@/features/breathing/patterns'

/**
 * Breath cues you can feel, for following along with eyes closed or the phone face down.
 *
 * web-haptics uses the Vibration API on Android and, on iPhone (Safari, iOS 18+), a hidden system
 * switch whose toggle fires the Taptic Engine, which is the only haptic a web page can reach there.
 */

/** Rising for the inhale, falling for the exhale, a single light tap for a hold. */
const CUES: Record<PhaseKind, { duration: number; intensity: number; delay?: number }[]> = {
  inhale: [
    { duration: 25, intensity: 0.35 },
    { delay: 110, duration: 35, intensity: 0.6 },
    { delay: 110, duration: 45, intensity: 0.85 },
  ],
  exhale: [
    { duration: 45, intensity: 0.85 },
    { delay: 140, duration: 35, intensity: 0.5 },
    { delay: 140, duration: 25, intensity: 0.25 },
  ],
  'hold-in': [{ duration: 15, intensity: 0.3 }],
  'hold-out': [{ duration: 15, intensity: 0.3 }],
}

let haptics: WebHaptics | null = null

/**
 * Whether this device can plausibly give haptic feedback. Desktop Chrome exposes the Vibration API
 * with no hardware behind it, and touchscreen laptops report touch points too, so this asks for a
 * finger as the primary pointer: phones and tablets.
 */
export function hapticsAvailable(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia('(pointer: coarse)').matches) return false
  return WebHaptics.isSupported || isIOS()
}

export function breathCue(kind: PhaseKind) {
  if (!hapticsAvailable()) return
  haptics ??= new WebHaptics()
  void haptics.trigger(CUES[kind]).catch(() => {})
}

export function stopHaptics() {
  haptics?.cancel()
}

/** Removes the hidden element web-haptics adds to the page. */
export function releaseHaptics() {
  haptics?.destroy()
  haptics = null
}
