import { NextResponse } from 'next/server'
import { fetchMessageBatchByConversation } from '@/lib/rag/messages'

export async function GET() {
  try {
    // Try to fetch the first batch of messages
    const result = await fetchMessageBatchByConversation()

    return NextResponse.json({
      success: true,
      messageCount: result.messages.length,
      hasMore: result.hasMore,
      lastId: result.lastId,
      // Include first message as sample (if exists)
      sampleMessage: result.messages[0] || null,
    })
  } catch (error) {
    console.error('RAG Test Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
} 