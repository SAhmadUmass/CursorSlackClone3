'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Channel, Message } from '@/types'
import { MessageList } from '@/components/chat/message-list'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { useChannelSubscription } from '@/hooks/useChannelSubscription'
import { Hash } from 'lucide-react'

interface ChannelChatWindowProps {
  channel: Channel
  initialMessages?: Message[]
  className?: string
}

export function ChannelChatWindow({ channel, initialMessages = [], className }: ChannelChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (autoScroll && messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight
    }
  }, [messages, autoScroll])

  // Handle scroll events to determine if we should auto-scroll
  useEffect(() => {
    const container = messageContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setAutoScroll(isAtBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

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

  // Fetch initial messages
  useEffect(() => {
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
          .eq('channel_id', channel.id)
          .order('created_at', { ascending: true })

        if (error) throw error

        setMessages(messages || [])
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [channel.id, supabase])

  // Set up real-time subscriptions
  useChannelSubscription({
    channelId: channel.id,
    onNewMessage: (message) => {
      setMessages((prev) => [...prev, message])
    },
    onMessageUpdate: (message) => {
      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? message : msg)))
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
      channel_id: channel.id,
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

    // Add temporary message to the list at the end
    setMessages((prev) => [...prev, tempMessage])

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: messageContent,
          user_id: currentUser.id,
          channel_id: channel.id,
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

      // Update the temporary message with server data
      const transformedMessage: Message = {
        ...data,
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
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="shrink-0 border-b px-4 py-2 flex items-center justify-between bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">{channel.name}</h2>
            {channel.description && (
              <p className="text-xs text-muted-foreground">{channel.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages - will grow/shrink with available space */}
      <div ref={messageContainerRef} className="flex-1 overflow-y-auto">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Message Input - fixed height */}
      <div
        className={cn(
          'shrink-0 p-4 border-t border-border',
          'bg-card/50 backdrop-blur-sm',
          'transition-colors duration-200'
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
            placeholder={`Message #${channel.name}`}
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