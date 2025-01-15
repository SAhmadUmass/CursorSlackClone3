'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Message } from '@/types'
import { MessageList } from '@/components/chat/message-list'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { useMessageSubscription } from '@/hooks/useMessageSubscription'
import { useInView } from 'react-intersection-observer'

interface DMChatWindowProps {
  conversationId: string
  initialMessages?: Message[]
  className?: string
}

export function DMChatWindow({ conversationId, initialMessages = [], className }: DMChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [otherUserName, setOtherUserName] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClientComponentClient()

  // Setup intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  })

  // Load more messages when scrolled to top
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      loadMoreMessages()
    }
  }, [inView])

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    try {
      const url = new URL(`/api/conversations/${conversationId}/messages`, window.location.origin)
      url.searchParams.set('limit', '50')
      if (nextCursor) {
        url.searchParams.set('before', nextCursor)
      }

      const response = await fetch(url.toString())
      const result = await response.json()

      if (result.success) {
        setMessages((prev) => [...prev, ...result.data])
        setHasMore(result.pagination.hasMore)
        setNextCursor(result.pagination.nextCursor)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

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
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get conversation and other user's info
        const { data: conversation } = await supabase
          .from('conversations')
          .select(
            `
            *,
            creator:users!conversations_created_by_fkey(
              id,
              full_name,
              email,
              avatar_url
            )
          `
          )
          .eq('id', conversationId)
          .eq('type', 'dm')
          .single()

        if (conversation) {
          setOtherUserName(conversation.creator?.full_name || 'Unknown User')
        }
      } catch (error) {
        console.error('Error fetching conversation:', error)
      }
    }

    const fetchMessages = async () => {
      try {
        const url = new URL(`/api/conversations/${conversationId}/messages`, window.location.origin)
        url.searchParams.set('limit', '50')
        const response = await fetch(url.toString())
        const result = await response.json()

        if (result.success) {
          setMessages(result.data)
          setHasMore(result.pagination.hasMore)
          setNextCursor(result.pagination.nextCursor)
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
    conversationType: 'dm',
    onNewMessage: (message) => {
      setMessages((prev) => [...prev, message])
    },
    onMessageUpdate: (message) => {
      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? message : msg)))
    },
    onMessageDelete: (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
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
      conversation_id: conversationId,
      conversation_type: 'dm',
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
    setMessages((prev) => [...prev, tempMessage])

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
    <div className={cn('flex-1 flex flex-col h-full max-h-screen', className)}>
      {/* Header */}
      <div className="border-b px-4 py-2 flex-shrink-0 flex items-center justify-between">
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
      <div className="flex-1 min-h-0">
        {/* Load More Messages Trigger */}
        {hasMore && (
          <div
            ref={loadMoreRef}
            className={cn(
              'py-2 text-center text-sm text-muted-foreground',
              isLoadingMore && 'animate-pulse'
            )}
          >
            {isLoadingMore ? 'Loading more messages...' : 'Load more messages'}
          </div>
        )}
        
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Message Input */}
      <div
        className={cn(
          'p-4 border-t border-border',
          'bg-card/50 backdrop-blur-sm',
          'transition-colors duration-200',
          'animate-in fade-in-50 duration-500',
          'flex-shrink-0'
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
        </div>
      </div>
    </div>
  )
}
