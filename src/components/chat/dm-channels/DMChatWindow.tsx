'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DMChannel, Message } from '@/types'
import { MessageList } from '@/components/chat/message-list'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { useDMSubscription } from '@/hooks/useDMSubscription'

interface DMChatWindowProps {
  channelId: string
  initialMessages?: Message[]
  className?: string
}

export function DMChatWindow({ channelId, initialMessages = [], className }: DMChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(true)
  const [otherUserName, setOtherUserName] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClientComponentClient()

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

  // Fetch initial data
  useEffect(() => {
    const fetchDMChannel = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get DM channel and other user's info
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
        // First try to fetch messages with dm_channel_id
        const { data: messages, error } = await supabase
          .from('messages')
          .select(
            `
            *,
            user:user_id(*)
          `
          )
          .eq('dm_channel_id', channelId)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Transform messages to include channel_id if needed
        const transformedMessages =
          messages?.map((msg) => ({
            ...msg,
            channel_id: msg.dm_channel_id || msg.channel_id, // Ensure channel_id is set for MessageList compatibility
          })) || []

        setMessages(transformedMessages)
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDMChannel()
    fetchMessages()
  }, [channelId, supabase])

  // Set up real-time subscriptions
  useDMSubscription({
    userId: currentUser?.id || '',
    channelId,
    onNewMessage: (message) => {
      // Transform the message to include channel_id if needed
      const transformedMessage = {
        ...message,
        channel_id: message.dm_channel_id || message.channel_id,
      }
      setMessages((prev) => [transformedMessage, ...prev])
    },
    onMessageUpdate: (message) => {
      // Transform the message to include channel_id if needed
      const transformedMessage = {
        ...message,
        channel_id: message.dm_channel_id || message.channel_id,
      }
      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? transformedMessage : msg)))
    },
    onPresenceChange: (userId, isOnline) => {
      // Only update if it's the other user's presence
      if (userId !== currentUser?.id) {
        setOtherUserOnline(isOnline)
      }
    },
  })

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return

    const clientGeneratedId = uuidv4()
    const messageContent = newMessage
    setNewMessage('') // Clear input immediately

    // Create temporary message
    const tempMessage: Message = {
      id: clientGeneratedId,
      channel_id: channelId, // Set for MessageList compatibility
      dm_channel_id: channelId, // Set for database storage
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

    // Add temporary message to the list
    setMessages((prev) => [tempMessage, ...prev])

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

      // Transform the server response to include channel_id
      const transformedMessage: Message = {
        ...data,
        channel_id: data.dm_channel_id, // Set for MessageList compatibility
        status: 'sent' as const,
      }

      // Update the temporary message with server data
      setMessages((prev) =>
        prev.map((msg) =>
          msg.client_generated_id === clientGeneratedId ? transformedMessage : msg
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
      // Update the temporary message with error status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.client_generated_id === clientGeneratedId ? { ...msg, status: 'error' as const } : msg
        )
      )
    }
  }

  return (
    <div className={cn('flex-1 flex flex-col', className)}>
      {/* Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{otherUserName}</h2>
          <p
            className={cn('text-xs', otherUserOnline ? 'text-green-500' : 'text-muted-foreground')}
          >
            {otherUserOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Message Input */}
      <div
        className={cn(
          'p-4 border-t border-border',
          'bg-card/50 backdrop-blur-sm',
          'transition-colors duration-200',
          'animate-in fade-in-50 duration-500'
        )}
      >
        <div className={cn('flex items-center gap-3', 'relative')}>
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
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'transition-all duration-200'
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
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              'flex items-center gap-2'
            )}
          >
            <span>Send</span>
            <svg
              className={cn(
                'w-4 h-4',
                'transition-transform duration-200',
                'group-hover:translate-x-0.5'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
        <div className={cn('text-xs text-muted-foreground/60', 'mt-2 ml-1')}>
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  )
}
