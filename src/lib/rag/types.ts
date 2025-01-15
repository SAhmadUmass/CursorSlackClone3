import { ConversationType } from '@/types'

export interface MessageMetadata {
  conversation_id: string
  conversation_type: ConversationType
  conversation_name?: string
  user_id: string
  user_name?: string
  created_at: string
  updated_at?: string
}

export interface MessageVector {
  id: string
  content: string
  embedding: number[]
  metadata: MessageMetadata
}

export interface MessageBatch {
  messages: MessageVector[]
  namespace: string
}

export interface MessageSearchResult {
  id: string
  score: number
  metadata: MessageMetadata
  content: string
}

export interface MessageSearchResponse {
  matches: MessageSearchResult[]
  namespace: string
}

export interface MessageSearchOptions {
  conversation_id?: string
  conversation_type?: ConversationType
  limit?: number
  minScore?: number
} 