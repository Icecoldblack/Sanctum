import { apiClient } from '@/api/client'
import type { ChatResponse } from '@/types'

export type ChatVariant = 'therapy' | 'legal'

export async function sendChatMessage(
  variant: ChatVariant,
  sessionId: string,
  message: string,
): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>(`/api/chat/${variant}`, {
    sessionId,
    message,
  })
  return data
}
