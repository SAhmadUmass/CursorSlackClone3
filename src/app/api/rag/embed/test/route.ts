import { NextResponse } from 'next/server'
import { fetchMessageBatchByConversation } from '@/lib/rag/messages'
import { processMessageBatches } from '@/lib/rag/embeddings'

export async function GET() {
  try {
    // 1. Fetch a small batch of messages (first 5 for testing)
    const messageBatch = await fetchMessageBatchByConversation()
    const testMessages = messageBatch.messages.slice(0, 5)

    // 2. Generate embeddings
    const embeddingResults = await processMessageBatches(testMessages)

    // 3. Return results with sample embedding
    return NextResponse.json({
      success: true,
      stats: {
        totalProcessed: testMessages.length,
        successful: embeddingResults.successful.length,
        failed: embeddingResults.failed.length,
      },
      // Include first successful embedding as sample (if exists)
      sampleEmbedding: embeddingResults.successful[0] ? {
        id: embeddingResults.successful[0].id,
        content: embeddingResults.successful[0].content,
        embedding: embeddingResults.successful[0].values.slice(0, 5) + '...' // Show first 5 dimensions
      } : null,
      error: embeddingResults.error
    })
  } catch (error) {
    console.error('Embedding Test Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 