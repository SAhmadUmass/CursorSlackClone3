import { Message } from '@/types'

export interface MessageForEmbedding {
  id: string
  content: string
  metadata: {
    user_id: string
    channel_id?: string
    dm_channel_id?: string
    created_at: string
    user_name: string
  }
}

export interface BatchProcessingResult {
  success: boolean
  processedCount: number
  error?: string
  lastProcessedId?: string
}

export interface MessageBatch {
  messages: MessageForEmbedding[]
  hasMore: boolean
  lastId?: string
}

export interface EmbeddedMessage {
  id: string
  values: number[]
  metadata: {
    content: string
    user_id: string
    channel_id?: string
    dm_channel_id?: string
    created_at: string
    user_name: string
  }
}

export interface EmbeddingBatchResult {
  successful: EmbeddedMessage[]
  failed: MessageForEmbedding[]
  error?: string
} 