import { useEffect, useRef } from 'react'

export function useAutoResize<T extends string>(value: T, maxHeightPx = 200) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeightPx)}px`
  }, [value, maxHeightPx])

  return ref
}
