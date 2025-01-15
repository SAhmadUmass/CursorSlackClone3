'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Message } from '@/types'
import { MessageList } from '@/components/chat/message-list'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { useMessageSubscription } from '@/hooks/useMessageSubscription'

interface ChannelChatWindowProps {
  conversationId: string
  initialMessages?: Message[]
  className?: string
}

export function ChannelChatWindow({ conversationId, initialMessages = [], className }: ChannelChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(true)
  const [channelName, setChannelName] = useState('')
  const [newMessage, setNewMessage] = useState('')
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
    const fetchConversation = async () => {
      try {
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('type', 'channel')
          .single()

        if (conversation) {
          setChannelName(conversation.name || 'Unknown Channel')
        }
      } catch (error) {
        console.error('Error fetching conversation:', error)
      }
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`)
        const result = await response.json()

        if (result.success) {
          setMessages(result.data)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversation()
    fetchMessages()
  }, [conversationId, supabase])

  // Set up real-time subscriptions
  useMessageSubscription({
    conversationId,
    conversationType: 'channel',
    onNewMessage: (message) => {
      setMessages((prev) => [message, ...prev])
    },
    onMessageUpdate: (message) => {
      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? message : msg)))
    },
    onMessageDelete: (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
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
      conversation_id: conversationId,
      conversation_type: 'channel',
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
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          client_generated_id: clientGeneratedId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the temporary message with server data
        setMessages((prev) =>
          prev.map((msg) =>
            msg.client_generated_id === clientGeneratedId
              ? { ...result.data, status: 'sent' as const }
              : msg
          )
        )
      } else {
        throw new Error(result.error || 'Failed to send message')
      }
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
      <div className="border-b px-4 py-2">
        <h2 className="font-semibold">{channelName}</h2>
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
            placeholder={`Message #${channelName}`}
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
        </div>
      </div>
    </div>
  )
} 