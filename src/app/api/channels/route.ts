import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('User not authenticated')

    // Fetch channels with message count using new schema
    const { data: channels, error } = await supabase
      .from('channels')
      .select(
        `
        *,
        messages:messages(count)
      `
      )
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: channels.map((channel) => ({
        ...channel,
        messageCount: channel.messages[0]?.count || 0,
      })),
    })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch channels' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json()
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('User not authenticated')

    // Create the channel - conversation_refs will be maintained by trigger
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({
        name,
        description,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: channel })
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json({ success: false, error: 'Failed to create channel' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('id')

    if (!channelId) {
      return NextResponse.json({ success: false, error: 'Channel ID is required' }, { status: 400 })
    }

    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('User not authenticated')

    // Verify channel ownership
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('created_by')
      .eq('id', channelId)
      .single()

    if (channelError) throw channelError
    if (channel.created_by !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the channel - conversation_refs and messages will be cleaned up by triggers
    const { error } = await supabase.from('channels').delete().eq('id', channelId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting channel:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete channel' }, { status: 500 })
  }
}
