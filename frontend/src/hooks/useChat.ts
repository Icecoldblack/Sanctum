import { useCallback, useState } from 'react'
import { sendChatMessage, type ChatVariant } from '@/api/chat'
import { useSession } from '@/hooks/useSession'
import type { ChatMessage } from '@/types'

export function useChat(variant: ChatVariant) {
  const { session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => session?.conversations[variant] ?? [],
  )
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.reply, timestamp: response.timestamp },
      ])
    } catch {
      setError('Your message could not be sent. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [input, session, isLoading, variant])

  return { messages, input, setInput, send, isLoading, error }
}
