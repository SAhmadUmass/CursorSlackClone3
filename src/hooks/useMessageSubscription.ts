import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore, SubscriptionStatus } from '@/lib/store/chat-store'
import { Message, ConversationType, User } from '@/types'
import { messageCache } from '@/lib/cache/message-cache'
import { subscriptionManager } from '@/lib/cache/subscription-manager'

interface MessageResponse {
  id: string
  conversation_id: string
  conversation_type: ConversationType
  user_id: string
  content: string
  created_at: string
  client_generated_id: string
  user: User
}

interface UseMessageSubscriptionProps {
  conversationId: string
  onNewMessage?: (message: Message) => void
  onMessageUpdate?: (message: Message) => void
  onMessageDelete?: (messageId: string) => void
  onPresenceChange?: (userId: string, isOnline: boolean) => void
}

interface UseMessageSubscriptionResult {
  messages: Message[]
  subscriptionStatus: SubscriptionStatus | undefined
  unsubscribe: () => void
}

export const useMessageSubscription = ({
  conversationId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
  onPresenceChange,
}: UseMessageSubscriptionProps): UseMessageSubscriptionResult => {
  const supabase = createClient()
  const { addMessage, updateMessage, deleteMessage, setSubscriptionStatus } = useChatStore()
  const messageSubscriptionRef = useRef<ReturnType<typeof supabase.channel>>()
  const presenceSubscriptionRef = useRef<ReturnType<typeof supabase.channel>>()

  // Subscribe to messages in the conversation
  useEffect(() => {
    if (!conversationId) return

    const setupMessageChannel = () => {
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            // Check cache first
            const cachedMessages = messageCache.getMessages(conversationId)
            if (cachedMessages.some(msg => msg.client_generated_id === payload.new.client_generated_id)) {
              return
            }

            // Fetch the complete message with user data
            const { data, error } = await supabase
              .from('messages')
              .select(
                `
                id,
                conversation_id,
                conversation_type,
                user_id,
                content,
                created_at,
                client_generated_id,
                user:users!messages_user_id_fkey (
                  id,
                  email,
                  full_name,
                  avatar_url
                )
              `
              )
              .eq('id', payload.new.id)
              .single<MessageResponse>()

            if (!error && data) {
              const message: Message = {
                id: data.id,
                conversation_id: data.conversation_id,
                conversation_type: data.conversation_type,
                user_id: data.user_id,
                content: data.content,
                created_at: data.created_at,
                client_generated_id: data.client_generated_id,
                user: data.user,
              }

              // Update cache and store
              messageCache.addMessage(conversationId, message)
              addMessage(message)
              onNewMessage?.(message)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            // Fetch the updated message with user data
            const { data, error } = await supabase
              .from('messages')
              .select(
                `
                id,
                conversation_id,
                conversation_type,
                user_id,
                content,
                created_at,
                client_generated_id,
                user:users!messages_user_id_fkey (
                  id,
                  email,
                  full_name,
                  avatar_url
                )
              `
              )
              .eq('id', payload.new.id)
              .single<MessageResponse>()

            if (!error && data) {
              const message: Message = {
                id: data.id,
                conversation_id: data.conversation_id,
                conversation_type: data.conversation_type,
                user_id: data.user_id,
                content: data.content,
                created_at: data.created_at,
                client_generated_id: data.client_generated_id,
                user: data.user,
              }

              // Update cache and store
              messageCache.updateMessage(conversationId, message)
              updateMessage(message)
              onMessageUpdate?.(message)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            // Update cache and store
            messageCache.deleteMessage(conversationId, payload.old.id)
            deleteMessage(payload.old.id)
            onMessageDelete?.(payload.old.id)
          }
        )
        .on(
          'system',
          { event: 'SUBSCRIBED' },
          () => {
            setSubscriptionStatus(conversationId, 'connected')
          }
        )
        .on(
          'system',
          { event: 'CHANNEL_ERROR' },
          () => {
            setSubscriptionStatus(conversationId, 'error')
          }
        )
        .on(
          'system',
          { event: 'DISCONNECT' },
          () => {
            setSubscriptionStatus(conversationId, 'disconnected')
            subscriptionManager.handleDisconnect(
              `messages:${conversationId}`,
              supabase,
              setupMessageChannel
            )
          }
        )
        .subscribe()

      messageSubscriptionRef.current = channel
      subscriptionManager.registerSubscription(`messages:${conversationId}`, channel)
      setSubscriptionStatus(conversationId, 'connecting')

      return channel
    }

    setupMessageChannel()

    return () => {
      if (messageSubscriptionRef.current) {
        subscriptionManager.removeSubscription(`messages:${conversationId}`, supabase)
      }
    }
  }, [
    conversationId,
    addMessage,
    updateMessage,
    deleteMessage,
    setSubscriptionStatus,
    onNewMessage,
    onMessageUpdate,
    onMessageDelete,
  ])

  // Subscribe to user presence if needed
  useEffect(() => {
    if (!conversationId || !onPresenceChange) return

    const setupPresenceChannel = () => {
      const channel = supabase
        .channel(`presence:${conversationId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          // Process presence state and notify changes
          Object.entries(state).forEach(([userId, userState]) => {
            const isOnline = Array.isArray(userState) && userState.length > 0
            onPresenceChange(userId, isOnline)
          })
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          onPresenceChange(key, true)
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          onPresenceChange(key, false)
        })
        .subscribe()

      presenceSubscriptionRef.current = channel
      subscriptionManager.registerSubscription(`presence:${conversationId}`, channel)

      return channel
    }

    setupPresenceChannel()

    return () => {
      if (presenceSubscriptionRef.current) {
        subscriptionManager.removeSubscription(`presence:${conversationId}`, supabase)
      }
    }
  }, [conversationId, onPresenceChange])

  const unsubscribe = () => {
    if (messageSubscriptionRef.current) {
      subscriptionManager.removeSubscription(`messages:${conversationId}`, supabase)
    }
    if (presenceSubscriptionRef.current) {
      subscriptionManager.removeSubscription(`presence:${conversationId}`, supabase)
    }
  }

  return {
    messages: messageCache.getMessages(conversationId),
    subscriptionStatus: useChatStore((state) => state.getSubscriptionStatus(conversationId)),
    unsubscribe,
  }
} 