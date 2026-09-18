import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const normalized: ApiError = error.response
      ? {
          status: error.response.status,
          code: (error.response.data as { code?: string } | undefined)?.code ?? 'unknown_error',
          message:
            (error.response.data as { message?: string } | undefined)?.message ??
            'Something went wrong. Please try again.',
        }
      : {
          status: 0,
          code: 'network_error',
          message: 'Could not reach the server. You may be offline.',
        }
    return Promise.reject(normalized)
  },
)
