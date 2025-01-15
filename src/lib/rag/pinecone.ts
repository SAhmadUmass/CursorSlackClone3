import { Pinecone } from '@pinecone-database/pinecone'
import { MessageVector } from './types'
import { env } from '@/env.mjs'

// Only initialize Pinecone if all required environment variables are present
const pinecone = env.PINECONE_API_KEY && env.PINECONE_ENVIRONMENT && env.PINECONE_INDEX
  ? new Pinecone({
      apiKey: env.PINECONE_API_KEY
    })
  : null

// Get the index instance if Pinecone is initialized
const index = pinecone?.index(env.PINECONE_INDEX || '')

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
 * Upsert vectors to Pinecone with proper namespace management
 */
export async function upsertVectors(vectors: MessageVector[], namespace: string) {
  // Skip if Pinecone is not initialized
  if (!index) {
    console.warn('Pinecone is not initialized. Skipping vector upsert.')
    return {
      success: false,
      count: 0,
      reason: 'Pinecone not initialized'
    }
  }

  try {
    const records = vectors.map(vector => ({
      id: vector.id,
      values: vector.embedding,
      metadata: {
        ...cleanMetadata(vector.metadata),
        content: vector.content // Store content in metadata for retrieval
      }
    }))

    // Upsert in batches of 100 (Pinecone's recommended batch size)
    const batchSize = 100
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      await index.namespace(namespace).upsert(batch)
    }

    return {
      success: true,
      count: records.length
    }
  } catch (error) {
    console.error('Error upserting to Pinecone:', error)
    throw error
  }
}

/**
 * Query Pinecone index with namespace support
 */
export async function queryVectors(vector: number[], namespace: string, topK: number = 5) {
  // Skip if Pinecone is not initialized
  if (!index) {
    console.warn('Pinecone is not initialized. Skipping vector query.')
    return {
      matches: [],
      namespace
    }
  }

  try {
    const results = await index.namespace(namespace).query({
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
 * Delete vectors from Pinecone with namespace support
 */
export async function deleteVectors(ids: string[], namespace: string) {
  // Skip if Pinecone is not initialized
  if (!index) {
    console.warn('Pinecone is not initialized. Skipping vector deletion.')
    return {
      success: false,
      count: 0,
      reason: 'Pinecone not initialized'
    }
  }

  try {
    await index.namespace(namespace).deleteMany(ids)
    return {
      success: true,
      count: ids.length
    }
  } catch (error) {
    console.error('Error deleting from Pinecone:', error)
    throw error
  }
} 