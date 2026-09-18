interface LoadingSpinnerProps {
  label?: string
  size?: number
}

export function LoadingSpinner({ label = 'Loading', size = 24 }: LoadingSpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-on-surface-variant">
      <span
        className="animate-spin rounded-full border-2 border-outline-variant border-t-primary"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </span>
  )
}
