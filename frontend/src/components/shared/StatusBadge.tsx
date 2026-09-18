import type { ReactNode } from 'react'
import { Icon } from '@/components/shared/Icon'

type Status = 'online' | 'offline' | 'warning'

interface StatusBadgeProps {
  status: Status
  children: ReactNode
}

const config: Record<Status, { icon: string; classes: string }> = {
  online: { icon: 'check_circle', classes: 'bg-primary-container text-on-primary-container' },
  offline: { icon: 'wifi_off', classes: 'bg-tertiary-container text-on-tertiary-container' },
  warning: { icon: 'warning', classes: 'bg-error-container text-on-error-container' },
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const { icon, classes } = config[status]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${classes}`}
    >
      <Icon name={icon} filled className="text-base" />
      {children}
    </span>
  )
}
