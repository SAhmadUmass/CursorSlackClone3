import { MessageBatch } from './types'
import { upsertVectors } from './pinecone'
import { ConversationType } from '@/types'

/**
 * @deprecated Use functions from pinecone.ts instead. This file will be removed in a future version.
 * The new implementation uses the conversation-based schema instead of separate channel/dm fields.
 */
export async function initVectorDB() {
  console.warn('Deprecated: initVectorDB is no longer needed. The Pinecone client is now initialized automatically.')
}

/**
 * @deprecated Use upsertVectors from pinecone.ts instead.
 * The new implementation uses the conversation-based schema instead of separate channel/dm fields.
 */
export async function uploadMessageToVectorDB(batch: MessageBatch) {
  console.warn('Deprecated: Use upsertVectors from pinecone.ts instead')
  return upsertVectors(batch.messages, `${batch.messages[0]?.metadata.conversation_type}-messages`)
}

/**
 * @deprecated Use types from types.ts instead.
 * This interface uses the old schema with channel_id/dm_channel_id.
 * Use MessageVector from types.ts which uses the new conversation-based schema.
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