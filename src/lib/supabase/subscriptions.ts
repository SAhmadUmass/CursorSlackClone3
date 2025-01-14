import { SupabaseClient } from '@supabase/supabase-js'
import { DMChannel, Message } from '@/types'

export const subscribeToDMChannels = (
  supabase: SupabaseClient,
  userId: string,
  onNewChannel: (channel: DMChannel) => void,
  onChannelUpdate: (channel: DMChannel) => void
) => {
  return supabase
    .channel('conversations')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `type=eq.dm,user1_id=eq.${userId},user2_id=eq.${userId}`,
      },
      (payload) => {
        onNewChannel(payload.new as DMChannel)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `type=eq.dm,user1_id=eq.${userId},user2_id=eq.${userId}`,
      },
      (payload) => {
        onChannelUpdate(payload.new as DMChannel)
      }
    )
    .subscribe()
}

export const subscribeToMessages = (
  supabase: SupabaseClient,
  conversationId: string,
  conversationType: 'channel' | 'dm',
  onNewMessage: (message: Message) => void,
  onMessageUpdate: (message: Message) => void
) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId},conversation_type=eq.${conversationType}`,
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
        filter: `conversation_id=eq.${conversationId},conversation_type=eq.${conversationType}`,
      },
      (payload) => {
        onMessageUpdate(payload.new as Message)
      }
    )
    .subscribe()
}

export const subscribeToUserPresence = (
  supabase: SupabaseClient,
  userId: string,
  onPresenceChange: (isOnline: boolean) => void
) => {
  // Create a channel for user presence
  const channel = supabase.channel(`presence:${userId}`)

  // Track presence
  channel
    .on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState()
      const isOnline = Object.keys(presenceState).length > 0
      onPresenceChange(isOnline)
    })
    .on('presence', { event: 'join' }, () => {
      onPresenceChange(true)
    })
    .on('presence', { event: 'leave' }, () => {
      onPresenceChange(false)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Enter the channel with user's metadata
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        })
      }
    })

  return channel
}

export const unsubscribeFromChannel = async (
  supabase: SupabaseClient,
  channel: ReturnType<typeof supabase.channel>
) => {
  await supabase.removeChannel(channel)
}
