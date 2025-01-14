import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/lib/store/chat-store'
import { Message } from '@/types'

interface MessageResponse {
  id: string
  channel_id: string
  user_id: string
  content: string
  created_at: string
  client_generated_id: string
  user: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
    created_at: string
  }
}

export const useRealtimeMessages = (channelId: string | null) => {
  const supabase = createClient()
  const { addMessage, updateMessage, deleteMessage, messages } = useChatStore()
  const processedMessages = useRef<Set<string>>(new Set())

  // Reset processed messages when channel changes
  useEffect(() => {
    processedMessages.current = new Set()
  }, [channelId])

  useEffect(() => {
    if (!channelId) return

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Check if we've already processed this message
          if (processedMessages.current.has(payload.new.client_generated_id)) {
            return
          }

          // Fetch the complete message with user data
          const { data, error } = await supabase
            .from('messages')
            .select(
              `
              id,
              channel_id,
              user_id,
              content,
              created_at,
              client_generated_id,
              user:users!messages_user_id_fkey (
                id,
                email,
                full_name,
                avatar_url,
                created_at
              )
            `
            )
            .eq('id', payload.new.id)
            .single<MessageResponse>()

          if (!error && data) {
            // Check if message already exists in the store
            const existingMessage = messages.find(
              (m) => m.client_generated_id === data.client_generated_id
            )

            if (!existingMessage) {
              const message: Message = {
                id: data.id,
                channel_id: data.channel_id,
                user_id: data.user_id,
                content: data.content,
                created_at: data.created_at,
                client_generated_id: data.client_generated_id,
                user: data.user,
              }
              addMessage(message)
              // Mark message as processed
              processedMessages.current.add(data.client_generated_id)
            }
          }
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
        async (payload) => {
          // Fetch the updated message with user data
          const { data, error } = await supabase
            .from('messages')
            .select(
              `
              id,
              channel_id,
              user_id,
              content,
              created_at,
              client_generated_id,
              user:users!messages_user_id_fkey (
                id,
                email,
                full_name,
                avatar_url,
                created_at
              )
            `
            )
            .eq('id', payload.new.id)
            .single<MessageResponse>()

          if (!error && data) {
            const message: Message = {
              id: data.id,
              channel_id: data.channel_id,
              user_id: data.user_id,
              content: data.content,
              created_at: data.created_at,
              client_generated_id: data.client_generated_id,
              user: data.user,
            }
            updateMessage(message)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          deleteMessage(payload.old.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, addMessage, updateMessage, deleteMessage, messages])
}
