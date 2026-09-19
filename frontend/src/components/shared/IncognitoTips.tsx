import { Modal } from '@/components/shared/Modal'
import { Icon } from '@/components/shared/Icon'

interface IncognitoTipsProps {
  open: boolean
  onClose: () => void
}

const tips = [
  {
    icon: 'tab',
    title: 'Use a private window',
    body: 'Ctrl+Shift+N in Chrome or Edge, Ctrl+Shift+P in Firefox. Nothing you visit is written to history.',
  },
  {
    icon: 'keyboard',
    title: 'Press Esc three times to leave',
    body: 'Anywhere in Sanctum, three quick taps of Esc leaves for an everyday site and erases your chats. You can change the shortcut in Safety settings.',
  },
  {
    icon: 'history',
    title: 'Clear history afterwards',
    body: 'If you cannot use a private window, delete this site from your browser history before handing the device back.',
  },
  {
    icon: 'devices',
    title: 'Borrow a safer device',
    body: 'A shared phone or computer may have monitoring software. A library, a friend, or a shelter device is safer.',
  },
  {
    icon: 'wifi_off',
    title: 'Be mindful of shared networks',
    body: 'A home router can log which sites were visited. Mobile data leaves no trace on the household network.',
  },
]

export function IncognitoTips({ open, onClose }: IncognitoTipsProps) {
  return (
    <Modal open={open} onClose={onClose} title="Browsing safely">
      <ul className="space-y-5">
        {tips.map(({ icon, title, body }) => (
          <li key={title} className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container">
              <Icon name={icon} className="text-primary text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-on-surface">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
