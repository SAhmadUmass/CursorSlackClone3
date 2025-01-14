import { Message } from '@/types'
import { processMessageBatches } from './embeddings'
import { upsertEmbeddings } from './pinecone'
import { MessageForEmbedding } from './types'

/**
 * Process a single message for embedding in real-time
 * This is optimized for single message processing and includes error handling
 */
export async function processMessageRealtime(message: Message): Promise<boolean> {
  try {
    // Skip if message has no content
    if (!message.content?.trim()) {
      return false
    }

    // Transform to embedding format
    const messageForEmbedding: MessageForEmbedding = {
      id: message.id,
      content: message.content,
      metadata: {
        user_id: message.user_id,
        channel_id: message.channel_id,
        dm_channel_id: message.dm_channel_id,
        created_at: message.created_at,
        user_name: message.user?.full_name || 'Unknown User'
      }
    }

    // Generate embedding
    const embeddingResult = await processMessageBatches([messageForEmbedding])
    
    // If successful, store in Pinecone
    if (embeddingResult.successful.length > 0) {
      await upsertEmbeddings(embeddingResult.successful)
      return true
    }

    return false
  } catch (error) {
    // Log error but don't throw - we don't want to disrupt message sending
    console.error('Error processing message for embedding:', error)
    return false
  }
}

/**
 * Wrapper to process message in background
 * Use this in message creation endpoints to avoid blocking
 */
export function processMessageBackground(message: Message): void {
  processMessageRealtime(message)
    .catch(error => {
      console.error('Background message processing failed:', error)
    })
} 