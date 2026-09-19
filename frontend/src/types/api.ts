export interface ChatRequest {
  sessionId: string
  message: string
}

export interface ChatResponse {
  reply: string
  timestamp: string
}

export interface ExpandRequest {
  sessionId: string
  shortInput: string
}

export interface ExpandResponse {
  expandedMessage: string
}

export interface EncodeRequest {
  sessionId: string
  message: string
  image: Blob
}

export interface GenerateResponse {
  imageUrl: string
  byteSize: number
}

export interface EncodeResponse {
  imageUrl: string
  byteSize: number
}

export type DecodeResult =
  | { status: 'found'; decodedMessage: string }
  | { status: 'not_found' }
  | { status: 'unreadable' }

export interface DecodeResponse {
  found: boolean
  decodedMessage?: string
}

export interface CreateSessionResponse {
  sessionId: string
  createdAt: string
  expiresAt: string
}

export interface ApiError {
  status: number
  code: string
  message: string
}
