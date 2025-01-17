import { NextResponse } from 'next/server'
import { fetchMessageBatchByConversation } from '@/lib/rag/messages'
import { generateEmbeddings } from '@/lib/rag/embeddings'
import { upsertVectors } from '@/lib/rag/pinecone'
import { ConversationType } from '@/types'
import { MessageVector } from '@/lib/rag/types'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has admin access
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get conversation type from query params, default to 'channel'
    const { searchParams } = new URL(request.url)
    const conversationType = (searchParams.get('type') as ConversationType) || 'channel'

    const stats = {
      totalMessages: 0,
      processedMessages: 0,
      failedMessages: 0,
      vectorsUploaded: 0,
      startTime: new Date().toISOString()
    }

    let lastId: string | undefined
    let hasMore = true

    // Process all messages in batches
    while (hasMore) {
      // 1. Fetch batch of messages with the new conversation-based function
      const { messages, hasMore: moreMessages, lastId: newLastId } = 
        await fetchMessageBatchByConversation(lastId, {
          conversationType,
          batchSize: 50
        })
      
      stats.totalMessages += messages.length

      if (messages.length > 0) {
        try {
          // 2. Generate embeddings
          const embeddings = await generateEmbeddings(messages.map(m => m.content))
          
          // Combine messages with their embeddings
          const vectors: MessageVector[] = messages.map((msg, i) => ({
            ...msg,
            embedding: embeddings[i]
          }))

          // 3. Upload to Pinecone with namespace based on conversation type
          const pineconeResult = await upsertVectors(vectors, `${conversationType}-messages`)
          stats.vectorsUploaded += pineconeResult.count
          stats.processedMessages += messages.length
        } catch (error) {
          console.error('Error processing batch:', error)
          stats.failedMessages += messages.length
        }
      }

      // Update batch tracking
      hasMore = moreMessages
      lastId = newLastId
      
      // Optional: Add progress log
      console.log('Progress:', stats)
    }

    // Log completion in database
    await supabase.from('rag_upload_logs').insert([{
      user_id: user.id,
      conversation_type: conversationType,
      total_messages: stats.totalMessages,
      processed_messages: stats.processedMessages,
      failed_messages: stats.failedMessages,
      vectors_uploaded: stats.vectorsUploaded,
      start_time: stats.startTime,
      end_time: new Date().toISOString()
    }])

    return NextResponse.json({
      success: true,
      stats,
      message: `Completed uploading ${conversationType} messages to vector store`
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