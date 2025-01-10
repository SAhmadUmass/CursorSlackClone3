import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sendDMMessageSchema } from '@/lib/validations/dm'

export async function GET(req: Request, { params }: { params: { channelId: string } }) {
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

    // Verify user has access to this DM channel
    const { data: channel } = await supabase
      .from('dm_channels')
      .select('*')
      .eq('id', params.channelId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found or access denied' }, { status: 404 })
    }

    // Get messages for the channel
    const { data: messages, error } = await supabase
      .from('messages')
      .select(
        `
        *,
        user:user_id(id, full_name, email, avatar_url)
      `
      )
      .eq('dm_channel_id', params.channelId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error in GET /api/dm-channels/[channelId]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { channelId: string } }) {
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

    // Validate request body
    const json = await req.json()
    const result = sendDMMessageSchema.safeParse(json)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { content, client_generated_id } = result.data

    // Verify user has access to this DM channel
    const { data: channel } = await supabase
      .from('dm_channels')
      .select('*')
      .eq('id', params.channelId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found or access denied' }, { status: 404 })
    }

    // Create the message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        content,
        user_id: user.id,
        dm_channel_id: params.channelId,
        client_generated_id,
      })
      .select(
        `
        *,
        user:user_id(id, full_name, email, avatar_url)
      `
      )
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error in POST /api/dm-channels/[channelId]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
