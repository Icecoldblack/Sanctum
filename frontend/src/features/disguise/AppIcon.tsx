import { useEffect, useMemo, useState } from 'react'
import type { IconSpec } from '@/features/disguise/presets'
import { renderIcon } from '@/features/disguise/renderIcon'

interface AppIconProps {
  icon: IconSpec
  name: string
  size?: number
  className?: string
}

/** Shows an icon exactly as it will be rendered for the tab and home screen. */
export function AppIcon({ icon, name, size = 56, className = '' }: AppIconProps) {
  const [src, setSrc] = useState<string | null>(icon.kind === 'image' ? icon.dataUrl : null)
  // Callers often build the spec inline; key on its content, not its identity.
  const iconKey = icon.kind === 'image' ? icon.dataUrl : `${icon.symbol}|${icon.background}|${icon.foreground}`
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableIcon = useMemo(() => icon, [iconKey])

  useEffect(() => {
    let cancelled = false
    renderIcon(stableIcon, size * 2, 'rounded', name)
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setSrc(null))
    return () => {
      cancelled = true
    }
  }, [stableIcon, name, size])

  return src ? (
    <img src={src} alt="" width={size} height={size} className={`shrink-0 ${className}`} style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-[22%] bg-surface-container-high ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
