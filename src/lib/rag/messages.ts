import { createClient } from '@/lib/supabase/server'
import { MessageBatch, MessageForEmbedding } from './types'

const BATCH_SIZE = 100

interface MessageWithUser {
  id: string
  content: string
  user_id: string
  channel_id?: string
  dm_channel_id?: string
  created_at: string
  user: {
    id: string
    full_name: string
  } | null
}

export async function fetchMessageBatch(lastId?: string): Promise<MessageBatch> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('messages')
      .select(
        `
        id,
        content,
        user_id,
        channel_id,
        dm_channel_id,
        created_at,
        user:users!messages_user_id_fkey (
          id,
          full_name
        )
      `
      )
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    // If we have a lastId, start after that message
    if (lastId) {
      query = query.gt('id', lastId)
    }

    const { data: messages, error } = await query

    if (error) {
      throw error
    }

    // Transform messages into the format we need for embeddings
    const transformedMessages: MessageForEmbedding[] = (messages as MessageWithUser[]).map((msg) => ({
      id: msg.id,
      content: msg.content,
      metadata: {
        user_id: msg.user_id,
        channel_id: msg.channel_id,
        dm_channel_id: msg.dm_channel_id,
        created_at: msg.created_at,
        user_name: msg.user?.full_name || 'Unknown User'
      }
    }))

    // Check if there are more messages
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gt('id', messages[messages.length - 1]?.id || '')

    return {
      messages: transformedMessages,
      hasMore: (count || 0) > 0,
      lastId: messages[messages.length - 1]?.id
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw error
  }
} 