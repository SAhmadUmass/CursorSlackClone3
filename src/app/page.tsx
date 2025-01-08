'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/lib/store/chat-store'
import { Channel, Message } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { AppSidebar } from '@/components/chat/app-sidebar'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const { channels, currentChannel, messages, setChannels, setCurrentChannel, setMessages, addMessage } = useChatStore()
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Initialize real-time subscription
  useRealtimeMessages(currentChannel?.id ?? null)

  // Fetch user on mount
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
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

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: currentChannel.id,
          content: newMessage,
          userId: user.id,
          clientGeneratedId
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Only add the message locally if it's not a duplicate
        if (!result.duplicate) {
          addMessage(result.data)
        }
        setNewMessage('')
      } else {
        console.error('Failed to send message:', result.error)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Helper function to format message timestamp
  const formatMessageTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString()
    } catch (error) {
      return ''
    }
  }

  // Helper function to get user display name
  const getUserDisplayName = (message: Message) => {
    if (message.user?.full_name) {
      return message.user.full_name
    }
    return 'Unknown User'
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
        <header className="h-14 border-b flex items-center px-4 bg-background">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">
              {currentChannel ? `# ${currentChannel.name}` : 'Select a channel'}
            </h2>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                {getUserDisplayName(message).charAt(0)}
              </div>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="font-semibold text-foreground">{getUserDisplayName(message)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
                <p className="text-foreground">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center space-x-2">
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
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={!currentChannel}
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentChannel}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 