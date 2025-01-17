import { NextResponse } from 'next/server'
import { fetchMessageBatchByConversation } from '@/lib/rag/messages'
import { processMessageBatches } from '@/lib/rag/embeddings'
import { upsertVectors } from '@/lib/rag/pinecone'

export async function GET() {
  try {
    // 1. Fetch test messages (first 5 for testing)
    const messageBatch = await fetchMessageBatchByConversation()
    const testMessages = messageBatch.messages.slice(0, 5)
    
    // 2. Generate embeddings
    const embeddingResults = await processMessageBatches(testMessages)
    
    if (embeddingResults.failed.length > 0) {
      throw new Error(`Failed to generate embeddings for ${embeddingResults.failed.length} messages`)
    }

    // 3. Store in Pinecone (using a test namespace)
    const pineconeResult = await upsertVectors(embeddingResults.successful, 'test-namespace')

    return NextResponse.json({
      success: true,
      stats: {
        messagesProcessed: testMessages.length,
        embeddingsGenerated: embeddingResults.successful.length,
        vectorsStored: pineconeResult.count
      },
      // Sample data for verification
      sampleMessage: {
        original: testMessages[0],
        embedded: embeddingResults.successful[0] ? {
          id: embeddingResults.successful[0].id,
          dimensions: embeddingResults.successful[0].values.length,
          preview: embeddingResults.successful[0].values.slice(0, 3) + '...'
        } : null
      }
    })
  } catch (error) {
    console.error('Pipeline Test Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 