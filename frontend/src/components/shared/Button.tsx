import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  isLoading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-primary to-primary-dim text-on-primary shadow-lg hover:opacity-90 disabled:opacity-50',
  secondary:
    'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant disabled:opacity-50',
  ghost: 'bg-transparent text-primary hover:bg-primary-container/40 disabled:opacity-50',
  danger: 'bg-error text-on-error hover:brightness-110 disabled:opacity-50',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', isLoading = false, disabled, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`inline-flex min-h-11 items-center justify-center gap-3 rounded-full px-8 py-4 text-lg font-bold transition-all active:scale-95 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      aria-busy={isLoading}
      {...rest}
    >
      {children}
    </button>
  )
})
