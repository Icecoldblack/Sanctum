import type { ChatMessage } from '@/types'

const LABELS: Record<string, { user: string; assistant: string }> = {
  legal: { user: 'You', assistant: 'Compass' },
  therapy: { user: 'You', assistant: 'Haven' },
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString()
}

export function conversationToText(variant: string, messages: ChatMessage[]): string {
  const labels = LABELS[variant] ?? { user: 'You', assistant: 'Sanctum' }
  const header = [
    'Conversation notes',
    `Exported ${new Date().toLocaleString()}`,
    '',
    'This transcript is not legal or medical advice. Anyone who finds this file can',
    'read it, so store it somewhere only you can reach, or delete it once used.',
    '',
    '---',
    '',
  ].join('\n')

  const body = messages
    .map(
      ({ role, content, timestamp }) =>
        `[${formatTimestamp(timestamp)}] ${role === 'user' ? labels.user : labels.assistant}\n${content}\n`,
    )
    .join('\n')

  return header + body
}

/**
 * Saves the transcript locally. Deliberately a client-side blob download: the
 * transcript never goes back to the server just to be formatted.
 */
export function downloadConversation(variant: string, messages: ChatMessage[]): void {
  const text = conversationToText(variant, messages)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  // Neutral name: the file sits in Downloads, where anyone with the device can see it.
  anchor.download = `notes-${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
