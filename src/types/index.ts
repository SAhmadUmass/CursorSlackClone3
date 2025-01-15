export type ConversationType = 'channel' | 'dm'

export interface Conversation {
  id: string
  type: ConversationType
  name: string | null
  description: string | null
  created_by: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  conversation_type: ConversationType
  user_id: string
  content: string
  created_at: string
  updated_at?: string
  client_generated_id: string
  has_attachments?: boolean
  status?: 'sending' | 'sent' | 'error'
  user?: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
  }
}

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

export interface SendMessageRequest {
  content: string
  client_generated_id: string
}

export interface MessageSource {
  id: string
  content: string
  created_at: string
  conversation_id: string
  conversation_type: ConversationType
  user: {
    id: string
    full_name: string
  }
}


