// User types
export interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

// Message types
export interface Message {
  id: string
  userId: number
  content: string
  timestamp: Date
}

// Chat types
export interface ChatRoom {
  id: string
  name: string
  participants: User[]
  messages: Message[]
}

// API Response types
export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
