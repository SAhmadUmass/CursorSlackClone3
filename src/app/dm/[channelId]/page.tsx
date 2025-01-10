'use client'

import { useEffect, useState, useRef } from 'react'
import { Message } from '@/types'
import { MessageList } from '@/components/chat/message-list'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/navigation'

interface DMPageProps {
  params: {
    channelId: string
  }
}

interface DBMessage {
  id: string
  dm_channel_id: string
  user_id: string
  content: string
  created_at: string
  client_generated_id: string
  user: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
  }
}

function isValidChannelId(channelId: string | undefined): channelId is string {
  return typeof channelId === 'string' && channelId.length > 0
}

export default function DMPage({ params }: DMPageProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [otherUserName, setOtherUserName] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const processedMessages = useRef<Set<string>>(new Set())
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Validate channelId
  useEffect(() => {
    if (!isValidChannelId(params.channelId)) {
      router.push('/404')
    }
  }, [params.channelId, router])

  // Early return if no channelId
  if (!isValidChannelId(params.channelId)) {
    return null
  }

  // Since we've validated channelId exists and is valid, we can safely assert its type
  const channelId = params.channelId as string

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    fetchUser()
  }, [supabase])

  useEffect(() => {
    const fetchDMChannel = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: channel } = await supabase
          .from('dm_channels')
          .select(
            `
            *,
            user1:user1_id(*),
            user2:user2_id(*)
          `
          )
          .eq('id', channelId)
          .single()

        if (channel) {
          const otherUser = channel.user1.id === user.id ? channel.user2 : channel.user1
          setOtherUserName(otherUser.full_name)
        }
      } catch (error) {
        console.error('Error fetching DM channel:', error)
      }
    }

    const fetchMessages = async () => {
      try {
        const { data: messages, error } = await supabase
          .from('messages')
          .select(
            `
            *,
            user:user_id(*)
          `
          )
          .eq('dm_channel_id', channelId)
          .order('created_at', { ascending: true })

        if (error) throw error

        const transformedMessages =
          messages?.map((msg) => ({
            ...msg,
            channel_id: msg.dm_channel_id,
            status: 'sent' as const,
          })) || []

        setMessages(transformedMessages)

        // Add all existing messages to processed set
        messages?.forEach((msg) => {
          if (msg.client_generated_id) {
            processedMessages.current.add(msg.client_generated_id)
          }
        })
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDMChannel()
    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `dm_channel_id=eq.${channelId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as DBMessage
            if (!processedMessages.current.has(newMessage.client_generated_id)) {
              const transformedMessage: Message = {
                ...newMessage,
                channel_id: newMessage.dm_channel_id,
                status: 'sent' as const,
              }
              setMessages((prev) => [...prev, transformedMessage])
              processedMessages.current.add(newMessage.client_generated_id)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      processedMessages.current.clear()
    }
  }, [channelId, supabase])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return

    const clientGeneratedId = uuidv4()
    const messageContent = newMessage
    setNewMessage('') // Clear input immediately

    // Add to processed messages immediately
    processedMessages.current.add(clientGeneratedId)

    // Create temporary message
    const tempMessage: Message = {
      id: clientGeneratedId,
      channel_id: channelId,
      user_id: currentUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      client_generated_id: clientGeneratedId,
      status: 'sending',
      user: {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.user_metadata?.full_name || 'Unknown User',
        avatar_url: null,
      },
    }

    setMessages((prev) => [...prev, tempMessage])

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: messageContent,
          user_id: currentUser.id,
          dm_channel_id: channelId,
          client_generated_id: clientGeneratedId,
        })
        .select(
          `
          *,
          user:user_id(*)
        `
        )
        .single()

      if (error) throw error

      const transformedMessage: Message = {
        ...data,
        channel_id: data.dm_channel_id,
        status: 'sent' as const,
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.client_generated_id === clientGeneratedId ? transformedMessage : msg
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.client_generated_id === clientGeneratedId ? { ...msg, status: 'error' as const } : msg
        )
      )
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{otherUserName.charAt(0)}</span>
          </div>
          <div>
            <h2 className="font-semibold text-base">{otherUserName}</h2>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>
      </div>

      {/* Messages - will grow/shrink with available space */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Message Input - fixed at bottom */}
      <div
        className={cn(
          'w-full',
          'border-t border-border',
          'bg-background',
          'fixed bottom-0 left-0 right-0',
          'px-4 py-3'
        )}
      >
        <div className="flex items-center gap-3 max-w-[1200px] mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={`Message ${otherUserName}`}
            className={cn(
              'flex-1',
              'rounded-xl',
              'border border-border',
              'bg-background/80',
              'px-4 py-2.5',
              'text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/20'
            )}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={cn(
              'px-4 py-2.5',
              'bg-primary text-primary-foreground',
              'rounded-xl',
              'font-medium',
              'hover:bg-primary/90',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Send
          </button>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind fixed input */}
      <div className="h-16" />
    </div>
  )
}
