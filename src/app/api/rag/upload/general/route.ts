import { NextResponse } from 'next/server'
import { fetchMessageBatch } from '@/lib/rag/messages'
import { processMessageBatches } from '@/lib/rag/embeddings'
import { upsertEmbeddings } from '@/lib/rag/pinecone'

export async function GET() {
  try {
    const stats = {
      totalMessages: 0,
      processedMessages: 0,
      failedMessages: 0,
      vectorsUploaded: 0
    }

    let lastId: string | undefined
    let hasMore = true

    // Process all messages in batches
    while (hasMore) {
      // 1. Fetch batch of messages
      const messageBatch = await fetchMessageBatch(lastId)
      const messages = messageBatch.messages.filter(msg => msg.metadata.channel_id) // Only channel messages
      stats.totalMessages += messages.length

      if (messages.length > 0) {
        // 2. Generate embeddings
        const embeddingResults = await processMessageBatches(messages)
        stats.processedMessages += embeddingResults.successful.length
        stats.failedMessages += embeddingResults.failed.length

        // 3. Upload to Pinecone
        if (embeddingResults.successful.length > 0) {
          const pineconeResult = await upsertEmbeddings(embeddingResults.successful)
          stats.vectorsUploaded += pineconeResult.count
        }
      }

      // Prepare for next batch
      hasMore = messageBatch.hasMore
      lastId = messageBatch.lastId
      
      // Optional: Add progress log
      console.log('Progress:', stats)
    }

    return NextResponse.json({
      success: true,
      stats,
      message: 'Completed uploading general channel messages to vector store'
    })
  } catch (error) {
    console.error('Upload Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 