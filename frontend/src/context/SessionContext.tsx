import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  createSession,
  deleteSession as deleteSessionRequest,
  fetchSession,
} from '@/api/session'
import type { ChatMessage, Session } from '@/types'
import type { ChatVariant } from '@/api/chat'

const STORAGE_KEY = 'sanctum_session_id'

interface SessionContextValue {
  session: Session | null
  isLoading: boolean
  clearData: () => Promise<void>
  /** Mirrors a completed exchange into context so it survives navigation. */
  recordMessages: (variant: ChatVariant, messages: ChatMessage[]) => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

function createOfflineSession(): Session {
  const now = new Date()
  const expires = new Date(now.getTime() + 10 * 60_000)
  return {
    sessionId: `local-${crypto.randomUUID()}`,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    conversations: {},
    isOffline: true,
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function init() {
      let storedId = localStorage.getItem(STORAGE_KEY)
      if (storedId?.startsWith('local-')) {
        localStorage.removeItem(STORAGE_KEY)
        storedId = null
      }

      // Resume the stored session first so conversations survive a reload or a
      // full page navigation. A 404/410 means it expired server-side, in which
      // case we fall through and create a new one.
      if (storedId) {
        try {
          const existing = await fetchSession(storedId)
          if (cancelled) return
          setSession({
            sessionId: existing.sessionId,
            createdAt: existing.createdAt,
            expiresAt: existing.expiresAt,
            situationSummary: existing.situationSummary,
            conversations: existing.conversations ?? {},
            isOffline: false,
          })
          setIsLoading(false)
          return
        } catch {
          if (cancelled) return
          localStorage.removeItem(STORAGE_KEY)
        }
      }

      try {
        const created = await createSession()
        if (cancelled) return
        localStorage.setItem(STORAGE_KEY, created.sessionId)
        setSession({
          sessionId: created.sessionId,
          createdAt: created.createdAt,
          expiresAt: created.expiresAt,
          conversations: {},
          isOffline: false,
        })
      } catch {
        if (cancelled) return
        setSession(createOfflineSession())
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  const clearData = useCallback(async () => {
    const current = session
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    if (current && !current.isOffline) {
      try {
        await deleteSessionRequest(current.sessionId)
      } catch {
        // Best-effort: local state is already cleared regardless of server outcome.
      }
    }
    // Start a fresh server session so chat and SOS keep working without a reload.
    try {
      const created = await createSession()
      localStorage.setItem(STORAGE_KEY, created.sessionId)
      setSession({
        sessionId: created.sessionId,
        createdAt: created.createdAt,
        expiresAt: created.expiresAt,
        conversations: {},
        isOffline: false,
      })
    } catch {
      setSession(createOfflineSession())
    }
  }, [session])

  const recordMessages = useCallback((variant: ChatVariant, messages: ChatMessage[]) => {
    setSession((prev) =>
      prev
        ? { ...prev, conversations: { ...prev.conversations, [variant]: messages } }
        : prev,
    )
  }, [])

  return (
    <SessionContext.Provider value={{ session, isLoading, clearData, recordMessages }}>
      {children}
    </SessionContext.Provider>
  )
}
