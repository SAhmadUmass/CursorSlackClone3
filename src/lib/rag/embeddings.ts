import OpenAI from 'openai'
import { MessageForEmbedding, EmbeddedMessage, EmbeddingBatchResult } from './types'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const EMBEDDING_MODEL = 'text-embedding-ada-002'
const BATCH_SIZE = 50 // OpenAI recommends smaller batches

/**
 * Generate embeddings for a batch of messages
 */
export async function generateEmbeddings(
  messages: MessageForEmbedding[]
): Promise<EmbeddingBatchResult> {
  try {
    // Get embeddings for all messages in the batch
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: messages.map(msg => msg.content),
    })

    // Map embeddings back to messages
    const successful: EmbeddedMessage[] = response.data.map((embedding, index) => ({
      id: messages[index].id,
      values: embedding.embedding,
      metadata: {
        content: messages[index].content,
        ...messages[index].metadata
      }
    }))

    return {
      successful,
      failed: []
    }
  } catch (error) {
    console.error('Error generating embeddings:', error)
    return {
      successful: [],
      failed: messages,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Process messages in batches to generate embeddings
 */
export async function processMessageBatches(
  messages: MessageForEmbedding[]
): Promise<EmbeddingBatchResult> {
  const results: EmbeddingBatchResult = {
    successful: [],
    failed: []
  }

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE)
    const batchResult = await generateEmbeddings(batch)

    results.successful.push(...batchResult.successful)
    results.failed.push(...batchResult.failed)

    // Optional: Add delay between batches if needed
    if (i + BATCH_SIZE < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results
} 