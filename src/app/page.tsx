'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Channel, Message } from '@/types'
import { useSupabase } from './providers'
import { useChatStore } from '@/lib/store/chat-store'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { useRealtimeChannels } from '@/hooks/useRealtimeChannels'
import AppSidebar from '@/components/chat/app-sidebar'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { channels, currentChannel, setChannels, setCurrentChannel, setMessages, addMessage } =
    useChatStore()

  // Initialize real-time subscription
  useRealtimeMessages(currentChannel?.id ?? null, 'channel')
  useRealtimeChannels()

  // Fetch user on mount
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }
      setUser(user)
    }
    getUser()
  }, [router, supabase])

  // Fetch channels on mount
  useEffect(() => {
    async function fetchChannels() {
      try {
        const response = await fetch('/api/channels')
        const result = await response.json()

        if (result.success) {
          setChannels(result.data)
          // Set first channel as current if none selected
          if (!currentChannel && result.data.length > 0) {
            setCurrentChannel(result.data[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChannels()
  }, [currentChannel, setChannels, setCurrentChannel])

  // Fetch messages when channel changes
  useEffect(() => {
    async function fetchMessages() {
      if (!currentChannel) return

      try {
        const response = await fetch(`/api/conversations/${currentChannel.id}/messages?type=channel`)
        const result = await response.json()

        if (result.success) {
          setMessages(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }

    fetchMessages()
  }, [currentChannel?.id, setMessages])

  const handleChannelClick = (channel: Channel) => {
    setCurrentChannel(channel)
  }

  const handleSendMessage = async (content: string) => {
    if (!currentChannel || !user) return

    const clientGeneratedId = crypto.randomUUID()

    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: clientGeneratedId,
      conversation_id: currentChannel.id,
      conversation_type: 'channel',
      user_id: user.id,
      content,
      created_at: new Date().toISOString(),
      client_generated_id: clientGeneratedId,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      },
      status: 'sending',
    }

    // Add optimistic message to store
    addMessage(optimisticMessage)

    try {
      const response = await fetch(`/api/conversations/${currentChannel.id}/messages?type=channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          client_generated_id: clientGeneratedId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Update message status to sent
      addMessage({
        ...optimisticMessage,
        status: 'sent',
      })
    } catch (error) {
      console.error('Error sending message:', error)
      // Update message status to error
      addMessage({
        ...optimisticMessage,
        status: 'error',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <AppSidebar
        channels={channels}
        currentChannel={currentChannel}
        onChannelSelect={handleChannelClick}
      />
      <main className={cn('flex flex-1 flex-col', 'bg-background')}>
        {currentChannel ? (
          <>
            <MessageList messages={[]} />
            <MessageInput onSendMessage={handleSendMessage} mode="channel" />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-lg text-muted-foreground">Select a channel to start chatting</p>
          </div>
        )}
      </main>
    </div>
  )
}
