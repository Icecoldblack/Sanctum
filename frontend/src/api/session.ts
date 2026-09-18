import { apiClient } from '@/api/client'
import type { CreateSessionResponse, Session } from '@/types'

export async function createSession(): Promise<CreateSessionResponse> {
  const { data } = await apiClient.post<CreateSessionResponse>('/api/sessions')
  return data
}

export async function fetchSession(sessionId: string): Promise<Session> {
  const { data } = await apiClient.get<Session>(`/api/sessions/${sessionId}`)
  return data
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/api/sessions/${sessionId}`)
}
