'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Message, ConversationType } from '@/types'
import { DMChatWindow } from '@/components/chat/conversations/dm/DMChatWindow'
import { ChannelChatWindow } from '@/components/chat/conversations/channel/ChannelChatWindow'

export default function ConversationPage() {
  const params = useParams()
  const conversationId = params.id as string
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [conversationType, setConversationType] = useState<ConversationType | null>(null)

  useEffect(() => {
    const fetchConversationAndMessages = async () => {
      try {
        // First fetch conversation type
        const conversationResponse = await fetch(`/api/conversations?id=${conversationId}`)
        const conversationData = await conversationResponse.json()
        
        if (!conversationResponse.ok) {
          throw new Error(conversationData.error || 'Failed to fetch conversation')
        }
        
        setConversationType(conversationData.type)

        // Then fetch messages
        const messagesResponse = await fetch(`/api/conversations/${conversationId}/messages`)
        const messagesResult = await messagesResponse.json()

        if (messagesResult.success) {
          setInitialMessages(messagesResult.data)
        } else {
          throw new Error(messagesResult.error || 'Failed to fetch messages')
        }
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load conversation')
      } finally {
        setLoading(false)
      }
    }

    fetchConversationAndMessages()
  }, [conversationId])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!conversationType) return <div>Conversation not found</div>

  return conversationType === 'dm' ? (
    <DMChatWindow
      conversationId={conversationId}
      initialMessages={initialMessages}
    />
  ) : (
    <ChannelChatWindow
      conversationId={conversationId}
      initialMessages={initialMessages}
    />
  )
} 