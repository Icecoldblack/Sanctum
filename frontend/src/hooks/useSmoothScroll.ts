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
  const { pathname, hash } = useLocation()

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

  // Route changes should land at the top instantly, not glide there. With reduced motion there is
  // no Lenis instance, so fall back to the native scroll. A link to a section (/privacy#terms)
  // lands on that section instead.
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (target) {
      target.scrollIntoView()
    } else if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
    // Only on a new page: same-page anchor clicks are left to Lenis so they still glide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
}
