'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Message } from '@/types'
import { DMChatWindow } from '@/components/chat/conversations/dm/DMChatWindow'

export default function DMPage() {
  const params = useParams()
  const conversationId = params.channelId as string
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<Message[]>([])

  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`)
        const result = await response.json()

        if (result.success) {
          setInitialMessages(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch messages')
        }
      } catch (err) {
        console.error('Error fetching messages:', err)
        setError(err instanceof Error ? err.message : 'Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialMessages()
  }, [conversationId])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <DMChatWindow
      conversationId={conversationId}
      initialMessages={initialMessages}
    />
  )
}
