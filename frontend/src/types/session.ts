export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
  timestamp: string
}

export interface Conversations {
  therapy?: ChatMessage[]
  legal?: ChatMessage[]
}

export interface Session {
  sessionId: string
  createdAt: string
  expiresAt: string
  situationSummary?: string
  conversations: Conversations
  isOffline: boolean
}
