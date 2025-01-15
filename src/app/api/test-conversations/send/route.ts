import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST() {
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

    // 2. Get a test conversation (first one found)
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json({
        success: false,
        error: 'No conversations found to test with',
        details: conversationError?.message,
      })
    }

    // 3. Try to send a test message
    const testMessage = {
      conversation_id: conversation.id,
      conversation_type: conversation.type,
      user_id: user.id,
      content: 'Test message from conversation refactoring',
      client_generated_id: uuidv4(),
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert([testMessage])
      .select(
        `
        *,
        user:user_id(
          id,
          email,
          full_name,
          avatar_url
        )
      `
      )
      .single()

    if (messageError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test message',
        details: messageError.message,
      })
    }

    // 4. Verify the message was saved correctly
    const { data: fetchedMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', message.id)
      .single()

    return NextResponse.json({
      success: true,
      testResults: {
        messageSent: !!message,
        messageVerified: !!fetchedMessage,
        messageMatches: fetchedMessage?.conversation_id === conversation.id,
        originalMessage: testMessage,
        savedMessage: message,
        fetchedMessage,
      },
      conversation,
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