export type ConversationType = 'dm' | 'channel' | 'ai'

export interface Conversation {
  id: string
  type: ConversationType
  created_at: string
  created_by: string
  name?: string
  description?: string
  is_private?: boolean
  creator?: User
  members?: User[]
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  conversation_type: ConversationType
  user_id: string
  content: string
  created_at: string
  client_generated_id: string
  status?: 'sending' | 'sent' | 'error'
  error?: string
  user: User
  sources?: MessageSource[]
}

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
}

export interface SendMessageRequest {
  content: string
  client_generated_id: string
}

export interface MessageSource {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    full_name: string
  }
}


