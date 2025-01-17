import { Pinecone } from '@pinecone-database/pinecone'
import { MessageVector } from './types'
import { env } from '@/env.mjs'

// Log Pinecone environment variables
console.log('Pinecone Environment Variables:', {
  apiKey: env.PINECONE_API_KEY?.slice(0, 5) + '...',
  environment: env.PINECONE_ENVIRONMENT,
  index: env.PINECONE_INDEX_TWO
})

// Only initialize Pinecone if all required environment variables are present
const pc = new Pinecone({
  apiKey: env.PINECONE_API_KEY || '',
})

if (!env.PINECONE_API_KEY || !env.PINECONE_ENVIRONMENT || !env.PINECONE_INDEX_TWO) {
  console.error('Pinecone initialization failed. Missing environment variables:', {
    hasApiKey: !!env.PINECONE_API_KEY,
    hasEnvironment: !!env.PINECONE_ENVIRONMENT,
    hasIndex: !!env.PINECONE_INDEX_TWO
  })
}

// Get the index instance if Pinecone is initialized
const index = env.PINECONE_INDEX_TWO ? pc.index(env.PINECONE_INDEX_TWO) : null

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
    // First try a global search to see what's in the index
    console.log('Attempting global search first...')
    let results = await index.query({
      vector,
      topK: 10, // Get more results to filter
      includeMetadata: true
    })

    // Log all results for debugging
    console.log('All search results:', 
      results.matches.map(m => ({
        score: m.score,
        content: m.metadata?.content,
        user: m.metadata?.user_name,
        channel: m.metadata?.channel_id
      }))
    )

    // Filter for highly relevant results (score > 0.85)
    const relevantResults = results.matches.filter(m => m.score && m.score > 0.85)
    
    if (relevantResults.length > 0) {
      console.log('Found highly relevant results:', 
        relevantResults.map(m => ({
          score: m.score,
          content: m.metadata?.content,
          user: m.metadata?.user_name
        }))
      )
      // Return only relevant results
      return {
        ...results,
        matches: relevantResults
      }
    }

    // If no highly relevant results, try channel-specific search
    const channelId = namespace.replace('rag-channel-', '')
    console.log('No highly relevant results, trying channel:', channelId)
    
    results = await index.query({
      vector,
      topK,
      includeMetadata: true,
      filter: {
        channel_id: { $eq: channelId }
      }
    })

    // Log channel results
    console.log('Channel-specific results:', {
      channelId,
      matchCount: results.matches.length,
      matches: results.matches.map(m => ({
        score: m.score,
        content: m.metadata?.content
      }))
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

/**
 * List all namespaces in the index
 */
export async function listNamespaces() {
  if (!index) {
    console.warn('Pinecone is not initialized. Cannot list namespaces.')
    return []
  }

  try {
    // Try a query with no vector to get index stats
    const stats = await index.query({
      vector: Array(1536).fill(0),
      topK: 1,
      includeMetadata: true
    })
    
    console.log('Pinecone index query test:', {
      hasResults: stats.matches.length > 0,
      metadata: stats.matches[0]?.metadata
    })
    
    return stats
  } catch (error) {
    console.error('Error checking index:', error)
    throw error
  }
} 