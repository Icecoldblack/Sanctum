import { useCallback, useEffect, useRef, useState } from 'react'
import { sendChatMessage, type ChatVariant } from '@/api/chat'
import { useSession } from '@/hooks/useSession'
import type { ChatMessage } from '@/types'

export function useChat(variant: ChatVariant) {
  const { session, recordMessages } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => session?.conversations[variant] ?? [],
  )
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The session resolves asynchronously, so the first render usually has none.
  // Adopt its history once, but never clobber messages typed while it loaded.
  const hydratedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!session || hydratedFor.current === session.sessionId) return
    hydratedFor.current = session.sessionId
    const stored = session.conversations[variant]
    if (stored?.length) {
      setMessages((prev) => (prev.length ? prev : stored))
    }
  }, [session, variant])

  const send = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || !session || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      const response = await sendChatMessage(variant, session.sessionId, trimmed)
      setMessages((prev) => {
        const next: ChatMessage[] = [
          ...prev,
          { role: 'assistant', content: response.reply, timestamp: response.timestamp },
        ]
        recordMessages(variant, next)
        return next
      })
    } catch {
      setError('Your message could not be sent. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [input, session, isLoading, variant, recordMessages])

  return { messages, input, setInput, send, isLoading, error }
}
