import { apiClient } from '@/api/client'
import type { DecodeResponse, EncodeResponse, ExpandResponse, GenerateResponse } from '@/types'

export async function expandMessage(sessionId: string, shortInput: string): Promise<ExpandResponse> {
  const { data } = await apiClient.post<ExpandResponse>('/api/sos/expand', {
    sessionId,
    shortInput,
  })
  return data
}

/**
 * Asks the server for a new, natural-looking carrier photo. A blank scene gets a random everyday
 * one. Image generation takes around ten seconds, so this allows longer than the default timeout.
 */
export async function generateCarrier(sessionId: string, scene: string): Promise<GenerateResponse> {
  const { data } = await apiClient.post<GenerateResponse>(
    '/api/sos/generate',
    { sessionId, scene: scene.trim() || undefined },
    { timeout: 60_000 },
  )
  return data
}

export async function encodeMessage(
  sessionId: string,
  message: string,
  image: Blob,
): Promise<EncodeResponse> {
  const formData = new FormData()
  formData.append('sessionId', sessionId)
  formData.append('message', message)
  formData.append('image', image)

  const { data } = await apiClient.post<EncodeResponse>('/api/sos/encode', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function decodeImage(image: File): Promise<DecodeResponse> {
  const formData = new FormData()
  formData.append('image', image)

  const { data } = await apiClient.post<DecodeResponse>('/api/sos/decode', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
