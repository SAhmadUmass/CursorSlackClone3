import { useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DMChannel, Message } from '@/types'
import {
  subscribeToDMChannels,
  subscribeToDMMessages,
  subscribeToUserPresence,
  unsubscribeFromChannel,
} from '@/lib/supabase/subscriptions'

interface UseDMSubscriptionProps {
  userId: string
  channelId?: string
  onNewChannel?: (channel: DMChannel) => void
  onChannelUpdate?: (channel: DMChannel) => void
  onNewMessage?: (message: Message) => void
  onMessageUpdate?: (message: Message) => void
  onPresenceChange?: (userId: string, isOnline: boolean) => void
}

export function useDMSubscription({
  userId,
  channelId,
  onNewChannel,
  onChannelUpdate,
  onNewMessage,
  onMessageUpdate,
  onPresenceChange,
}: UseDMSubscriptionProps) {
  const supabase = createClientComponentClient()
  const channelsSubscriptionRef = useRef<ReturnType<typeof supabase.channel>>()
  const messagesSubscriptionRef = useRef<ReturnType<typeof supabase.channel>>()
  const presenceSubscriptionRef = useRef<ReturnType<typeof supabase.channel>>()

  // Subscribe to DM channels
  useEffect(() => {
    if (!userId || !onNewChannel || !onChannelUpdate) return

    const subscription = subscribeToDMChannels(
      supabase,
      userId,
      onNewChannel,
      onChannelUpdate
    )

    channelsSubscriptionRef.current = subscription

    return () => {
      if (channelsSubscriptionRef.current) {
        unsubscribeFromChannel(supabase, channelsSubscriptionRef.current)
      }
    }
  }, [userId, onNewChannel, onChannelUpdate, supabase])

  // Subscribe to messages in the current DM channel
  useEffect(() => {
    if (!channelId || !onNewMessage || !onMessageUpdate) return

    const subscription = subscribeToDMMessages(
      supabase,
      channelId,
      onNewMessage,
      onMessageUpdate
    )

    messagesSubscriptionRef.current = subscription

    return () => {
      if (messagesSubscriptionRef.current) {
        unsubscribeFromChannel(supabase, messagesSubscriptionRef.current)
      }
    }
  }, [channelId, onNewMessage, onMessageUpdate, supabase])

  // Subscribe to user presence
  useEffect(() => {
    if (!userId || !onPresenceChange) return

    const subscription = subscribeToUserPresence(
      supabase,
      userId,
      (isOnline) => onPresenceChange(userId, isOnline)
    )

    presenceSubscriptionRef.current = subscription

    return () => {
      if (presenceSubscriptionRef.current) {
        unsubscribeFromChannel(supabase, presenceSubscriptionRef.current)
      }
    }
  }, [userId, onPresenceChange, supabase])
} 