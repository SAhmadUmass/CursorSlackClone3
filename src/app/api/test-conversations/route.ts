import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Conversation, Message } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1. Test authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Test conversation table
    const { data: conversations, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1)

    if (conversationError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query conversations table',
        details: conversationError.message,
      })
    }

    // 3. Test messages table with new schema
    let testResults = {
      auth: 'Success: User authenticated',
      conversationsTable: conversations ? 'Success: Found conversations' : 'Warning: No conversations found',
      schema: {
        hasConversationType: false,
        hasConversationId: false,
        sample: null as any,
      },
      messageQuery: null as any,
    }

    // Test message schema
    const { data: messages, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .limit(1)

    if (messageError) {
      testResults.messageQuery = {
        success: false,
        error: messageError.message,
      }
    } else if (messages && messages.length > 0) {
      const sampleMessage = messages[0]
      testResults.schema = {
        hasConversationType: 'conversation_type' in sampleMessage,
        hasConversationId: 'conversation_id' in sampleMessage,
        sample: sampleMessage,
      }
      testResults.messageQuery = {
        success: true,
        messageCount: messages.length,
      }
    }

    // 4. Test DM participants table if it exists
    const { data: participants, error: participantsError } = await supabase
      .from('dm_participants')
      .select('*')
      .limit(1)

    return NextResponse.json({
      success: true,
      testResults: {
        ...testResults,
        dmParticipants: {
          exists: !participantsError,
          error: participantsError?.message,
          sample: participants?.[0],
        },
      },
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Test Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
} 