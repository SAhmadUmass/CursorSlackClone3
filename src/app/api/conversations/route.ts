import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Conversation, ConversationType } from '@/types'

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Get conversation type from query params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'channel' or 'dm'
    const id = searchParams.get('id')

    // Get all conversations (channels and DMs) for the user
    if (!type) {
      // Get all conversations
      console.log('Fetching conversations for user:', user.id)
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          name,
          type,
          description,
          created_at,
          created_by,
          creator:users!conversations_created_by_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .or(`type.eq.channel,and(type.eq.dm,or(created_by.eq.${user.id}))`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        return NextResponse.json(
          { error: 'Error fetching conversations' },
          { status: 500 }
        )
      }

      console.log('Raw conversations from DB:', conversations)

      // Define the type for raw conversation data from Supabase
      interface RawConversation {
        id: string
        type: ConversationType
        name: string | null
        description: string | null
        created_by: string
        created_at: string
        creator: {
          id: string
          full_name: string
          email: string
          avatar_url: string | null
        } | null
      }

      // First cast to unknown, then to RawConversation[]
      const rawConversations = conversations as unknown as RawConversation[]
      const processedConversations = (rawConversations || []).map((conv) => {
        if (conv.type === 'dm' && conv.creator) {
          return {
            id: conv.id,
            type: conv.type,
            name: conv.creator.full_name || 'Unknown User',
            description: conv.description,
            created_by: conv.created_by,
            created_at: conv.created_at
          }
        }
        return {
          id: conv.id,
          type: conv.type,
          name: conv.name,
          description: conv.description,
          created_by: conv.created_by,
          created_at: conv.created_at
        }
      })

      console.log('Processed conversations:', processedConversations)

      // Split conversations into channels and DMs
      const channels = processedConversations.filter(conv => conv.type === 'channel')
      const dms = processedConversations.filter(conv => conv.type === 'dm')

      console.log('Response:', { channels, dms })

      return NextResponse.json({
        channels,
        dms
      })
    }

    // Get specific conversation
    if (id) {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          creator:users!conversations_created_by_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('id', id)
        .eq('type', type)
        .single()

      if (error) {
        return NextResponse.json(
          { error: `${type} not found` },
          { status: 404 }
        )
      }

      // For DMs, verify user is creator
      if (type === 'dm' && data.created_by !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access to DM' },
          { status: 403 }
        )
      }

      // Set the name for DMs
      if (type === 'dm') {
        data.name = data.creator?.full_name || 'Unknown User'
      }

      // Remove creator object from response
      delete data.creator

      return NextResponse.json(data)
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in /api/conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, name, recipient_id } = await request.json()

    if (!type || (type !== 'channel' && type !== 'dm')) {
      return NextResponse.json(
        { error: 'Invalid conversation type' },
        { status: 400 }
      )
    }

    if (type === 'channel' && !name) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      )
    }

    if (type === 'dm' && !recipient_id) {
      return NextResponse.json(
        { error: 'Recipient ID is required for DM' },
        { status: 400 }
      )
    }

    // For DMs, check if a conversation already exists
    if (type === 'dm') {
      const { data: existingDM } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', 'dm')
        .eq('created_by', recipient_id)
        .single()

      if (existingDM) {
        return NextResponse.json(existingDM)
      }
    }

    // Create new conversation
    const { data: conversation, error: insertError } = await supabase
      .from('conversations')
      .insert([{ 
        type,
        name: type === 'channel' ? name : null,
        created_by: type === 'channel' ? user.id : recipient_id
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating conversation:', insertError)
      return NextResponse.json(
        { error: `Error creating ${type}` },
        { status: 500 }
      )
    }

    // For DMs, fetch the recipient's info to set the name
    if (type === 'dm' && conversation) {
      const { data: recipientInfo } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', recipient_id)
        .single()

      if (recipientInfo) {
        conversation.name = recipientInfo.full_name
      }
    }

    return NextResponse.json(conversation)

  } catch (error) {
    console.error('Error in POST /api/conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing type or id' },
        { status: 400 }
      )
    }

    // Verify user is conversation creator
    const { data: conversation } = await supabase
      .from('conversations')
      .select('created_by')
      .eq('id', id)
      .eq('type', type)
      .single()

    if (!conversation || conversation.created_by !== user.id) {
      return NextResponse.json(
        { error: `Unauthorized to delete ${type}` },
        { status: 403 }
      )
    }

    // Delete conversation (this will cascade delete messages)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('type', type)

    if (error) {
      console.error(`Error deleting ${type}:`, error)
      return NextResponse.json(
        { error: `Error deleting ${type}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 