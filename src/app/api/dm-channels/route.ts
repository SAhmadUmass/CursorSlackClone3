import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createDMChannelSchema } from '@/lib/validations/dm'
import { DMChannel } from '@/types'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate request body
    const json = await req.json()
    const result = createDMChannelSchema.safeParse(json)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { other_user_id } = result.data

    // Check if DM channel already exists
    const { data: existingChannel } = await supabase
      .from('dm_channels')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .or(`user1_id.eq.${other_user_id},user2_id.eq.${other_user_id}`)
      .single()

    if (existingChannel) {
      return NextResponse.json(existingChannel)
    }

    // Create new DM channel
    const { data: newChannel, error } = await supabase
      .from('dm_channels')
      .insert({
        user1_id: user.id,
        user2_id: other_user_id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create DM channel' },
        { status: 500 }
      )
    }

    return NextResponse.json(newChannel)
  } catch (error) {
    console.error('Error in POST /api/dm-channels:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all DM channels for the user
    const { data: channels, error } = await supabase
      .from('dm_channels')
      .select(`
        *,
        user1:user1_id(id, full_name, email, avatar_url),
        user2:user2_id(id, full_name, email, avatar_url)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch DM channels' },
        { status: 500 }
      )
    }

    // Transform the response to include only the other user's info
    const transformedChannels = channels.map((channel: any) => {
      const otherUser = channel.user1.id === user.id ? channel.user2 : channel.user1
      return {
        id: channel.id,
        created_at: channel.created_at,
        user1_id: channel.user1_id,
        user2_id: channel.user2_id,
        other_user: otherUser
      }
    })

    return NextResponse.json(transformedChannels)
  } catch (error) {
    console.error('Error in GET /api/dm-channels:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 