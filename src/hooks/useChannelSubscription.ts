import { useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Channel, Message } from '@/types'

interface UseChannelSubscriptionProps {
  channelId?: string
  onNewMessage?: (message: Message) => void
  onMessageUpdate?: (message: Message) => void
}

export function useChannelSubscription({
  channelId,
  onNewMessage,
  onMessageUpdate,
}: UseChannelSubscriptionProps) {
  const supabase = createClientComponentClient()
  const messagesSubscriptionRef = useRef<ReturnType<typeof supabase.channel>>()

  // Subscribe to messages in the current channel
  useEffect(() => {
    if (!channelId || !onNewMessage || !onMessageUpdate) return

    // Create a channel for messages
    const subscription = supabase
      .channel(`channel_messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          onNewMessage(payload.new as Message)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          onMessageUpdate(payload.new as Message)
        }
      )
      .subscribe()

    messagesSubscriptionRef.current = subscription

    return () => {
      if (messagesSubscriptionRef.current) {
        supabase.removeChannel(messagesSubscriptionRef.current)
      }
    }
  }, [channelId, onNewMessage, onMessageUpdate, supabase])
} 