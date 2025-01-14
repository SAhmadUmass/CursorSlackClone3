import { useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Message } from '@/types'
import { useChatStore } from '@/lib/store/chat-store'

interface MessageResponse {
  id: string
  conversation_id: string
  conversation_type: 'channel' | 'dm'
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

export const useRealtimeMessages = (conversationId: string | null, conversationType: 'channel' | 'dm') => {
  const supabase = createClientComponentClient()
  const { messages, addMessage, updateMessage, deleteMessage } = useChatStore()
  const processedMessages = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!conversationId) return

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId},conversation_type=eq.${conversationType}`,
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
              (m: Message) => m.client_generated_id === data.client_generated_id
            )

            if (!existingMessage) {
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
          filter: `conversation_id=eq.${conversationId},conversation_type=eq.${conversationType}`,
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
              conversation_id: data.conversation_id,
              conversation_type: data.conversation_type,
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
          filter: `conversation_id=eq.${conversationId},conversation_type=eq.${conversationType}`,
        },
        (payload) => {
          deleteMessage(payload.old.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, conversationType, supabase, messages, addMessage, updateMessage, deleteMessage])

  return {
    processedMessages,
  }
}
