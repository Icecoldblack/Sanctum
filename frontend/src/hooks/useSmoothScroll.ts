import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'

let lenis: Lenis | null = null

export function getLenis() {
  return lenis
}

/**
 * Inertial smooth scrolling for the whole document.
 *
 * Lenis is left on its defaults (lerp 0.1, smoothWheel on, native touch), which
 * is the same configuration the reference site runs. Touch is deliberately not
 * synced so mobile keeps its native momentum.
 */
export function useSmoothScroll() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Respect the OS setting: hijacking the wheel is exactly what people who
    // enable this are trying to avoid, so we leave native scrolling alone.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches) return

    const instance = new Lenis({ anchors: true })
    lenis = instance

    let rafId = requestAnimationFrame(function raf(time: number) {
      instance.raf(time)
      rafId = requestAnimationFrame(raf)
    })

    return () => {
      cancelAnimationFrame(rafId)
      instance.destroy()
      lenis = null
    }
  }, [])

  // Route changes should land at the top instantly, not glide there.
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true })
  }, [pathname])
}
