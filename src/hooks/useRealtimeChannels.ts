import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/lib/store/chat-store'
import { Channel } from '@/types'

export function useRealtimeChannels() {
  const { channels, addChannel, updateChannel, deleteChannel } = useChatStore()
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to channel changes
    const channelSubscription = supabase
      .channel('channels-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channels',
        },
        (payload) => {
          const newChannel = payload.new as Channel
          // Only add if the channel doesn't already exist
          if (!channels.some((channel) => channel.id === newChannel.id)) {
            addChannel(newChannel)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'channels',
        },
        (payload) => {
          const updatedChannel = payload.new as Channel
          updateChannel(updatedChannel)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'channels',
        },
        (payload) => {
          const deletedChannel = payload.old as Channel
          deleteChannel(deletedChannel.id)
        }
      )
      .subscribe()

    return () => {
      channelSubscription.unsubscribe()
    }
  }, [channels, addChannel, updateChannel, deleteChannel])
}
