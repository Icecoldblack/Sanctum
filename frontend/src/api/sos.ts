import { apiClient } from '@/api/client'
import type { DecodeResponse, EncodeResponse, ExpandResponse } from '@/types'

export async function expandMessage(sessionId: string, shortInput: string): Promise<ExpandResponse> {
  const { data } = await apiClient.post<ExpandResponse>('/api/sos/expand', {
    sessionId,
    shortInput,
  })
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
