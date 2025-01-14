/**
 * Unified Message API Endpoint
 * 
 * This endpoint is part of the message system refactoring that consolidates channel and DM messages
 * into a single, unified API. It uses a discriminated union pattern with conversation_type to 
 * handle both message types.
 * 
 * Database Schema:
 * - Messages table uses conversation_id + conversation_type instead of separate channel_id/dm_channel_id
 * - Referential integrity is maintained through the conversation_refs table
 * - Automatic cleanup is handled by database triggers
 * 
 * Usage:
 * GET/POST /api/conversations/{id}/messages?type=channel - For channel messages
 * GET/POST /api/conversations/{id}/messages?type=dm     - For DM messages
 * 
 * Security:
 * - Validates user authentication
 * - Checks access rights based on conversation type
 * - For channels: Verifies channel exists
 * - For DMs: Verifies user is a participant
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ConversationType } from '@/types'

/**
 * GET /api/conversations/[id]/messages
 * 
 * Fetches messages for a conversation (channel or DM) with proper access control.
 * Messages are ordered by creation date and limited to the most recent 50.
 * 
 * Query Parameters:
 * @param type - Required. Either 'channel' or 'dm'
 * 
 * Response:
 * - 200: { success: true, data: Message[] }
 * - 400: Invalid conversation type
 * - 401: Unauthorized
 * - 404: Conversation not found or access denied
 * - 500: Server error
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(req.url)
    const conversationType = searchParams.get('type') as ConversationType

    // Validate conversation type
    if (!conversationType || !['channel', 'dm'].includes(conversationType)) {
      return NextResponse.json(
        { error: 'Invalid conversation type' },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this conversation
    let hasAccess = false
    if (conversationType === 'channel') {
      const { data: channel } = await supabase
        .from('channels')
        .select('id')
        .eq('id', params.id)
        .single()
      hasAccess = !!channel
    } else {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', params.id)
        .eq('type', 'dm')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single()
      hasAccess = !!conversation
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Get messages for the conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select(
        `
        id,
        content,
        user_id,
        conversation_id,
        conversation_type,
        created_at,
        client_generated_id,
        user:users!messages_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `
      )
      .eq('conversation_id', params.id)
      .eq('conversation_type', conversationType)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations/[id]/messages
 * 
 * Creates a new message in a conversation (channel or DM) with proper access control.
 * Handles duplicate message prevention through client_generated_id.
 * 
 * Query Parameters:
 * @param type - Required. Either 'channel' or 'dm'
 * 
 * Request Body:
 * {
 *   content: string;           // Message content
 *   clientGeneratedId: string; // Client-side UUID for deduplication
 * }
 * 
 * Response:
 * - 200: { success: true, data: Message }
 * - 400: Invalid conversation type or missing fields
 * - 401: Unauthorized
 * - 404: Conversation not found or access denied
 * - 500: Server error
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(req.url)
    const conversationType = searchParams.get('type') as ConversationType

    // Validate conversation type
    if (!conversationType || !['channel', 'dm'].includes(conversationType)) {
      return NextResponse.json(
        { error: 'Invalid conversation type' },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const { content, clientGeneratedId } = await req.json()
    if (!content || !clientGeneratedId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has access to this conversation
    let hasAccess = false
    if (conversationType === 'channel') {
      const { data: channel } = await supabase
        .from('channels')
        .select('id')
        .eq('id', params.id)
        .single()
      hasAccess = !!channel
    } else {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', params.id)
        .eq('type', 'dm')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single()
      hasAccess = !!conversation
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Check for duplicate message
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('client_generated_id', clientGeneratedId)
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
          content,
          user_id: user.id,
          conversation_id: params.id,
          conversation_type: conversationType,
          client_generated_id: clientGeneratedId,
        },
      ])
      .select(
        `
        id,
        content,
        user_id,
        conversation_id,
        conversation_type,
        created_at,
        client_generated_id,
        user:users!messages_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `
      )
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // Transform message with proper typing
    const transformedMessage = {
      ...message,
      user: message.user || {
        id: message.user_id,
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
    console.error('Error in POST /api/conversations/[id]/messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 