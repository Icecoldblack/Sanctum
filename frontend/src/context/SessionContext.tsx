import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { createSession, deleteSession as deleteSessionRequest } from '@/api/session'
import type { Session } from '@/types'

const STORAGE_KEY = 'sanctum_session_id'

interface SessionContextValue {
  session: Session | null
  isLoading: boolean
  clearData: () => Promise<void>
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
      const storedId = localStorage.getItem(STORAGE_KEY)
      if (storedId?.startsWith('local-')) {
        localStorage.removeItem(STORAGE_KEY)
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
    setSession(createOfflineSession())
  }, [session])

  return (
    <SessionContext.Provider value={{ session, isLoading, clearData }}>
      {children}
    </SessionContext.Provider>
  )
}
