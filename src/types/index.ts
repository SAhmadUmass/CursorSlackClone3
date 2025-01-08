export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

export interface Channel {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  user_id: string
  content: string
  created_at: string
  client_generated_id: string
  status?: 'sending' | 'sent' | 'error'
  user?: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
  }
}

export interface ChannelWithMessageCount extends Channel {
  messageCount: number
} 