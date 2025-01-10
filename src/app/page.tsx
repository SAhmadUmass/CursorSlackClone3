'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/lib/store/chat-store'
import { Channel } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { useRealtimeChannels } from '@/hooks/useRealtimeChannels'
import { AppSidebar } from '@/components/chat/app-sidebar'
import { MessageList } from '@/components/chat/message-list'
import { v4 as uuidv4 } from 'uuid'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const {
    channels,
    currentChannel,
    messages,
    setChannels,
    setCurrentChannel,
    setMessages,
    addMessage,
  } = useChatStore()
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Initialize real-time subscription
  useRealtimeMessages(currentChannel?.id ?? null)
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
  }, [router])

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
  }, [])

  // Fetch messages when channel changes
  useEffect(() => {
    async function fetchMessages() {
      if (!currentChannel) return

      try {
        const response = await fetch(`/api/messages?channelId=${currentChannel.id}`)
        const result = await response.json()

        if (result.success) {
          setMessages(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }

    fetchMessages()
  }, [currentChannel?.id])

  const handleChannelClick = (channel: Channel) => {
    setCurrentChannel(channel)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChannel || !user) return

    const clientGeneratedId = uuidv4()
    const messageContent = newMessage
    setNewMessage('') // Clear input immediately

    // Create temporary message
    const tempMessage = {
      id: clientGeneratedId,
      channel_id: currentChannel.id,
      user_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      client_generated_id: clientGeneratedId,
      status: 'sending' as const,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Unknown User',
        avatar_url: null,
      },
    }

    // Add temporary message
    addMessage(tempMessage)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: currentChannel.id,
          content: messageContent,
          userId: user.id,
          clientGeneratedId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the temporary message with server data and 'sent' status
        addMessage({
          ...result.data,
          client_generated_id: clientGeneratedId,
          status: 'sent' as const,
        })
      } else {
        // Update the temporary message with 'error' status
        addMessage({
          ...tempMessage,
          status: 'error' as const,
        })
        console.error('Failed to send message:', result.error)
      }
    } catch (error) {
      // Update the temporary message with 'error' status
      addMessage({
        ...tempMessage,
        status: 'error' as const,
      })
      console.error('Failed to send message:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        channels={channels}
        currentChannel={currentChannel}
        onChannelSelect={handleChannelClick}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <header
          className={cn(
            'h-14 border-b border-border',
            'bg-card/50 backdrop-blur-sm',
            'flex items-center',
            'px-4',
            'transition-colors duration-200',
            'animate-in fade-in-50 duration-500'
          )}
        >
          <div className={cn('flex items-center gap-3', 'py-2.5')}>
            <div
              className={cn(
                'flex items-center justify-center',
                'h-6 w-6',
                'rounded-md',
                'bg-primary/10 dark:bg-primary/20',
                'transition-colors duration-200'
              )}
            >
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>

            <div className="flex flex-col">
              <h2
                className={cn(
                  'text-base font-semibold',
                  'text-foreground',
                  'flex items-center gap-2'
                )}
              >
                {currentChannel ? (
                  <>
                    <span className="text-primary">#</span>
                    <span>{currentChannel.name}</span>
                  </>
                ) : (
                  'Select a channel'
                )}
              </h2>
              {currentChannel && (
                <p className={cn('text-xs text-muted-foreground', 'mt-0.5')}>
                  {messages.length} messages
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <MessageList messages={messages} />

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
              placeholder={currentChannel ? `Message #${currentChannel.name}` : 'Select a channel'}
              className={cn(
                'flex-1',
                'rounded-xl',
                'border border-border',
                'bg-background/80',
                'px-4 py-2.5',
                'text-foreground',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
              disabled={!currentChannel}
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentChannel || !newMessage.trim()}
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
          {currentChannel && (
            <div className={cn('text-xs text-muted-foreground/60', 'mt-2 ml-1')}>
              Press Enter to send, Shift + Enter for new line
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
