import { MessageBatch } from './types'
import { upsertVectors } from './pinecone'
import { ConversationType } from '@/types'

/**
 * @deprecated This entire file is deprecated and will be removed.
 * Use functions from pinecone.ts and types from types.ts instead.
 * The new implementation uses the conversation-based schema.
 */

/**
 * @deprecated Use types from types.ts instead.
 * Use MessageVector which uses the new conversation-based schema.
 */
export interface EmbeddedMessage {
  id: string
  values: number[]
  metadata: {
    conversation_id: string
    conversation_type: ConversationType
    user_id: string
    created_at: string
  }
} 