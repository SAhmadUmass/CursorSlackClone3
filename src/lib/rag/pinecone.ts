import { Pinecone } from '@pinecone-database/pinecone'
import { EmbeddedMessage } from './types'

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not set')
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
})

const INDEX_NAME = 'rag-fusion-101-1536'

// Get the index instance
const index = pinecone.index(INDEX_NAME)

/**
 * Clean metadata for Pinecone requirements
 * Pinecone only accepts string, number, boolean, or array of strings
 */
function cleanMetadata(metadata: Record<string, any>) {
  const cleaned: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      continue // Skip null/undefined values
    }
    
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      Array.isArray(value)
    ) {
      cleaned[key] = value
    } else {
      // Convert other types to string
      cleaned[key] = String(value)
    }
  }
  
  return cleaned
}

/**
 * Upsert embeddings to Pinecone
 */
export async function upsertEmbeddings(messages: EmbeddedMessage[]) {
  try {
    const vectors = messages.map(message => ({
      id: message.id,
      values: message.values,
      metadata: cleanMetadata(message.metadata)
    }))

    // Upsert in batches of 100 (Pinecone's recommended batch size)
    const batchSize = 100
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize)
      await index.upsert(batch)
    }

    return {
      success: true,
      count: vectors.length
    }
  } catch (error) {
    console.error('Error upserting to Pinecone:', error)
    throw error
  }
}

/**
 * Query Pinecone index
 */
export async function queryEmbeddings(vector: number[], topK: number = 5) {
  try {
    const results = await index.query({
      vector,
      topK,
      includeMetadata: true
    })

    return results
  } catch (error) {
    console.error('Error querying Pinecone:', error)
    throw error
  }
}

/**
 * Delete embeddings from Pinecone
 */
export async function deleteEmbeddings(ids: string[]) {
  try {
    await index.deleteMany(ids)
    return {
      success: true,
      count: ids.length
    }
  } catch (error) {
    console.error('Error deleting from Pinecone:', error)
    throw error
  }
} 