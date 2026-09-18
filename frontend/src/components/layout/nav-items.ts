export interface NavItem {
  to: string
  label: string
  icon: string
}

export const navItems: NavItem[] = [
  { to: '/sos', label: 'SOS', icon: 'emergency_home' },
  { to: '/decode', label: 'Decoder', icon: 'key' },
  { to: '/therapy', label: 'Therapy', icon: 'psychology' },
  { to: '/legal', label: 'Compass', icon: 'explore' },
]
