import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()

  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const channelId = request.nextUrl.searchParams.get('channelId')
    
    if (!channelId) {
      return NextResponse.json(
        { success: false, error: 'Channel ID is required' },
        { status: 400 }
      )
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        channel_id,
        user_id,
        content,
        created_at,
        client_generated_id,
        user:users!messages_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    // Transform messages to handle potentially missing user data
    const transformedMessages = messages.map(message => ({
      ...message,
      user: message.user || {
        id: message.user_id,
        email: '',
        full_name: 'Unknown User',
        avatar_url: null
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedMessages,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { channelId, content, userId, clientGeneratedId } = await request.json()

    // Verify that the userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 403 }
      )
    }

    if (!channelId || !content || !clientGeneratedId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if message with this client ID already exists
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('client_generated_id', clientGeneratedId)
      .single()

    if (existingMessage) {
      return NextResponse.json({
        success: true,
        data: existingMessage,
        duplicate: true
      })
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          channel_id: channelId,
          user_id: user.id,
          content,
          client_generated_id: clientGeneratedId
        },
      ])
      .select(`
        id,
        channel_id,
        user_id,
        content,
        created_at,
        client_generated_id,
        user:users!messages_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      throw error
    }

    // Handle case where user data might be missing
    const transformedMessage = {
      ...message,
      user: message.user || {
        id: message.user_id,
        email: '',
        full_name: 'Unknown User',
        avatar_url: null
      }
    }

    return NextResponse.json({
      success: true,
      data: transformedMessage,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create message' },
      { status: 500 }
    )
  }
} 