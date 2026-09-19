import { useCallback, useEffect, useRef, useState } from 'react'
import { sendChatMessage, type ChatVariant } from '@/api/chat'
import { useSession } from '@/hooks/useSession'
import type { ChatMessage } from '@/types'

export function useChat(variant: ChatVariant) {
  const { session, recordMessages } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => session?.conversations[variant] ?? [],
  )
  // Latest messages, readable after an await without going through a state updater.
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The session resolves asynchronously, so the first render usually has none.
  // Adopt its history once, but never clobber messages typed while it loaded.
  // A later, different session means the data was erased: show that one's (empty) history.
  const hydratedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!session || hydratedFor.current === session.sessionId) return
    const replaced = hydratedFor.current !== null
    hydratedFor.current = session.sessionId
    const stored = session.conversations[variant] ?? []
    if (replaced) {
      setMessages(stored)
    } else if (stored.length) {
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

    messagesRef.current = [...messagesRef.current, userMessage]
    setMessages(messagesRef.current)
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      const response = await sendChatMessage(variant, session.sessionId, trimmed)
      const next: ChatMessage[] = [
        ...messagesRef.current,
        { role: 'assistant', content: response.reply, timestamp: response.timestamp },
      ]
      messagesRef.current = next
      setMessages(next)
      // Outside the state updater: updating another component's state from inside one is a React
      // error. It also records the reply if the person has already moved to another page.
      recordMessages(variant, next)
    } catch {
      setError('Your message could not be sent. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [input, session, isLoading, variant, recordMessages])

  return { messages, input, setInput, send, isLoading, error, ready: Boolean(session) }
}
