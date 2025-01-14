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
  messageCount?: number
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

export type ConversationType = 'channel' | 'dm' | 'ai'

export interface Message {
  id: string
  conversation_id: string
  conversation_type: ConversationType
  user_id: string
  content: string
  created_at: string
  client_generated_id: string
  status?: 'sending' | 'sent' | 'error'
  user: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
  }
  // AI-specific fields
  isAI?: boolean
  sources?: MessageSource[]
  error?: string
}

// Helper type for AI messages
export type AIMessage = Message & {
  isAI: true
  sources?: MessageSource[]
}

export interface ChannelWithMessageCount extends Channel {
  messageCount: number
}

export interface DMChannel {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  other_user?: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
  }
}

// Helper type guards
export const isChannelMessage = (message: Message): boolean => 
  message.conversation_type === 'channel';

export const isDMMessage = (message: Message): boolean => 
  message.conversation_type === 'dm';

export interface DMMessage extends Omit<Message, 'channel_id'> {
  dm_channel_id: string
}

export interface CreateDMChannelRequest {
  other_user_id: string
}

export interface SendDMMessageRequest {
  content: string
  client_generated_id: string
}
