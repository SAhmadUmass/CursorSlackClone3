import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/lib/store/chat-store'
import { processConversations } from '@/lib/utils/conversations'
import { Message } from '@/types'

export function useSubscriptions() {
  const supabase = createClient()
  const { 
    setConversations, 
    currentConversation,
    setMessages,
    user
  } = useChatStore()

  // Conversation subscription and initial fetch
  useEffect(() => {
    // Skip if no user is authenticated
    if (!user) return

    let mounted = true

    // Initial conversations fetch
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations')
        const data = await response.json()
        
        if (response.ok && mounted) {
          const allConversations = processConversations(data)
          setConversations(allConversations)
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
      }
    }

    // Fetch initial data
    fetchConversations()

    // Set up real-time subscription for conversations
    const conversationChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        // Reuse the same fetch function for real-time updates
        fetchConversations
      )
      .subscribe()

    // Cleanup subscriptions and mounted flag
    return () => {
      mounted = false
      supabase.removeChannel(conversationChannel)
    }
  }, [user]) // Only run when user changes (login/logout)

  // Message subscription - only subscribe when we have a current conversation
  useEffect(() => {
    if (!currentConversation?.id) {
      setMessages([]) // Reset messages when no conversation is selected
      return
    }

    console.log('Setting up message subscription for conversation:', currentConversation.id)

    // Initial messages fetch
    const fetchMessages = async () => {
      try {
        console.log('Fetching messages for conversation:', currentConversation.id)
        const response = await fetch(`/api/conversations/${currentConversation.id}/messages`)
        const { success, data, error } = await response.json()
        
        if (success && data) {
          console.log('Messages fetched:', data.length)
          // Use functional update to avoid stale state
          setMessages((currentMessages: Message[]): Message[] => {
            const existingClientIds = new Set(currentMessages.map((m: Message) => m.client_generated_id))
            const newMessages = data.filter((m: Message) => !existingClientIds.has(m.client_generated_id))
            return [...currentMessages, ...newMessages]
          })
        } else {
          console.error('Failed to fetch messages:', error)
          setMessages([])
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
        setMessages([])
      }
    }

    fetchMessages()

    // Set up real-time subscription for messages
    const messageChannel = supabase
      .channel(`messages-${currentConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversation.id}`
        },
        async (payload) => {
          console.log('Message change detected:', payload.eventType)
          // Only refetch if it's not our own optimistic update
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message
            // Use functional update to check for optimistic messages
            setMessages((currentMessages: Message[]): Message[] => {
              const isOptimistic = currentMessages.some((m: Message) => m.client_generated_id === newMessage.client_generated_id)
              if (!isOptimistic) {
                fetchMessages()
              }
              return currentMessages
            })
          } else {
            // For updates and deletes, always refetch
            fetchMessages()
          }
        }
      )
      .subscribe()

    // Cleanup subscription when conversation changes or component unmounts
    return () => {
      console.log('Cleaning up message subscription for conversation:', currentConversation.id)
      supabase.removeChannel(messageChannel)
      setMessages([]) // Reset messages when unmounting
    }
  }, [currentConversation?.id]) // Only re-run if conversation ID changes
} 