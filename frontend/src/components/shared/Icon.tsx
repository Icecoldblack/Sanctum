interface IconProps {
  name: string
  className?: string
  filled?: boolean
  ariaHidden?: boolean
  ariaLabel?: string
}

export function Icon({ name, className = '', filled = false, ariaHidden = true, ariaLabel }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden={ariaLabel ? undefined : ariaHidden}
      aria-label={ariaLabel}
    >
      {name}
    </span>
  )
}
