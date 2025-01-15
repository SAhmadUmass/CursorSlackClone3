import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Message, SendMessageRequest } from '@/types'
import { processMessageBackground } from '@/lib/rag/realtime'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // For DM conversations, verify user is a participant
    if (conversation.type === 'dm') {
      const { data: participants } = await supabase
        .from('dm_participants')
        .select('user_id')
        .eq('conversation_id', params.id)

      const isParticipant = participants?.some(p => p.user_id === user.id)
      if (!isParticipant) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get messages for the conversation
    const { data: messages, error } = await supabase
      .from('messages')
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
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Transform messages to handle potentially missing user data
    const transformedMessages = messages.map((message) => ({
      ...message,
      user: message.user || {
        id: message.user_id,
        email: '',
        full_name: 'Unknown User',
        avatar_url: null,
      },
    }))

    return NextResponse.json({
      success: true,
      data: transformedMessages,
    })
  } catch (error) {
    console.error('Error in GET /api/conversations/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get and validate request body
    const json = await req.json()
    const { content, client_generated_id } = json as SendMessageRequest

    // Enhanced content validation
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message content exceeds maximum length of 2000 characters' }, { status: 400 })
    }

    if (!client_generated_id) {
      return NextResponse.json({ error: 'client_generated_id is required' }, { status: 400 })
    }

    // Rate limiting check
    const { data: recentMessages, error: rateError } = await supabase
      .from('messages')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
      .order('created_at', { ascending: false })

    if (rateError) {
      console.error('Error checking rate limit:', rateError)
      return NextResponse.json({ error: 'Error checking rate limit' }, { status: 500 })
    }

    if (recentMessages && recentMessages.length >= 10) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait before sending more messages.' }, { status: 429 })
    }

    // Verify conversation exists and user has access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // For DM conversations, verify user is a participant
    if (conversation.type === 'dm') {
      const { data: participants } = await supabase
        .from('dm_participants')
        .select('user_id')
        .eq('conversation_id', params.id)

      const isParticipant = participants?.some(p => p.user_id === user.id)
      if (!isParticipant) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Check if message with this client ID already exists
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('client_generated_id', client_generated_id)
      .single()

    if (existingMessage) {
      return NextResponse.json({
        success: true,
        data: existingMessage,
        duplicate: true,
      })
    }

    // Create the message
    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: params.id,
          conversation_type: conversation.type,
          user_id: user.id,
          content,
          client_generated_id,
        },
      ])
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

    if (error) {
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // Transform message with proper typing
    const transformedMessage: Message = {
      ...message,
      user: message.user || {
        id: message.user_id,
        email: '',
        full_name: 'Unknown User',
        avatar_url: null,
      },
    }

    // Process embedding in background for channel messages
    // Make this optional - don't block message sending if it fails
    if (conversation.type === 'channel') {
      try {
        await processMessageBackground(transformedMessage)
      } catch (error) {
        // Log error but don't fail the request
        console.error('Failed to process message for RAG:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: transformedMessage,
    })
  } catch (error) {
    console.error('Error in POST /api/conversations/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get and validate request body
    const json = await req.json()
    const { messageId, content } = json

    // Enhanced content validation
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message content exceeds maximum length of 2000 characters' }, { status: 400 })
    }

    // Get the message and verify ownership
    const { data: message } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('conversation_id', params.id)
      .single()

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to edit message' }, { status: 403 })
    }

    // Update the message
    const { data: updatedMessage, error } = await supabase
      .from('messages')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', messageId)
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

    if (error) {
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    // Transform message with proper typing
    const transformedMessage: Message = {
      ...updatedMessage,
      user: updatedMessage.user || {
        id: updatedMessage.user_id,
        email: '',
        full_name: 'Unknown User',
        avatar_url: null,
      },
    }

    return NextResponse.json({
      success: true,
      data: transformedMessage,
    })
  } catch (error) {
    console.error('Error in PATCH /api/conversations/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get message ID from query params
    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    // Get the message and verify ownership
    const { data: message } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('conversation_id', params.id)
      .single()

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete message' }, { status: 403 })
    }

    // Delete the message
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { id: messageId },
    })
  } catch (error) {
    console.error('Error in DELETE /api/conversations/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 