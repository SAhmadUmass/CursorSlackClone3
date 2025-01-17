import { Message, ConversationType } from '@/types'
import { MessageVector, MessageMetadata } from './types'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { formatRelative } from 'date-fns'

const BATCH_SIZE = 50

interface DBMessage {
  id: string
  content: string
  conversation_id: string
  conversation_type: ConversationType
  user_id: string
  created_at: string
  updated_at: string | null
  conversation: {
    name: string | null
  } | null
  user: {
    full_name: string
  } | null
}

// Omit the user field from Message since we'll redefine it
type MessageBase = Omit<Message, 'user'>

interface MessageWithMetadata extends MessageBase {
  conversation?: {
    name: string | null
  }
  // Make user optional and only include what we need
  user?: {
    full_name: string
  }
  updated_at?: string | null
}

export function processMessageForEmbedding(message: DBMessage | MessageWithMetadata): MessageVector {
  const metadata: MessageMetadata = {
    conversation_id: message.conversation_id,
    conversation_type: message.conversation_type,
    conversation_name: message.conversation?.name || undefined,
    user_id: message.user_id,
    user_name: message.user?.full_name || undefined,
    created_at: message.created_at,
    updated_at: message.updated_at || undefined,
  }

  return {
    id: message.id,
    content: message.content,
    embedding: [], // Will be filled by the embedding service
    metadata,
  }
}

export function formatMessageSource(metadata: MessageMetadata): string {
  const date = new Date(metadata.created_at)
  const relativeDate = formatRelative(date, new Date())
  
  // Format based on conversation type
  if (metadata.conversation_type === 'channel') {
    return `Message from ${metadata.user_name || 'unknown user'} in channel #${metadata.conversation_name || 'unknown'} (${relativeDate})`
  } else {
    return `Direct message from ${metadata.user_name || 'unknown user'} (${relativeDate})`
  }
}

export async function fetchMessageBatchByConversation(
  lastId?: string,
  options: {
    conversationType?: ConversationType
    batchSize?: number
  } = {}
): Promise<{
  messages: MessageVector[]
  hasMore: boolean
  lastId?: string
}> {
  const supabase = createRouteHandlerClient({ cookies })
  const batchSize = options.batchSize || BATCH_SIZE

  let query = supabase
    .from('messages')
    .select(`
      id,
      content,
      conversation_id,
      conversation_type,
      user_id,
      created_at,
      updated_at,
      conversation:conversations!inner (
        name
      ),
      user:users!inner (
        full_name
      )
    `)
    .order('created_at', { ascending: true })
    .limit(batchSize)

  // Add conversation type filter if specified
  if (options.conversationType) {
    query = query.eq('conversation_type', options.conversationType)
  }

  // Add pagination if lastId is provided
  if (lastId) {
    query = query.gt('id', lastId)
  }

  const { data: messages, error } = await query

  if (error) {
    console.error('Error fetching messages:', error)
    throw error
  }

  // Process messages for embedding using the shared function
  const processedMessages = (messages as unknown as DBMessage[]).map(processMessageForEmbedding)

  return {
    messages: processedMessages,
    hasMore: messages.length === batchSize,
    lastId: messages[messages.length - 1]?.id
  }
} 