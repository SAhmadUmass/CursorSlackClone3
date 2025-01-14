import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { Message, ConversationType } from '@/types'

interface UseMessageSubscriptionProps {
  conversationId: string
  conversationType: ConversationType
}

export const useMessageSubscription = ({
  conversationId,
  conversationType,
}: UseMessageSubscriptionProps) => {
  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!conversationId || conversationType === 'ai') return

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
          // Fetch the complete message with user data
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              user:users(*)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            // Update React Query cache
            queryClient.setQueryData<Message[]>(['messages', conversationId], (old = []) => {
              // Avoid duplicates
              const exists = old.some((msg) => msg.id === newMessage.id)
              if (exists) return old
              return [newMessage, ...old]
            })
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
          const { data: updatedMessage } = await supabase
            .from('messages')
            .select(`
              *,
              user:users(*)
            `)
            .eq('id', payload.new.id)
            .single()

          if (updatedMessage) {
            queryClient.setQueryData<Message[]>(['messages', conversationId], (old = []) => {
              return old.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            })
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
          queryClient.setQueryData<Message[]>(['messages', conversationId], (old = []) => {
            return old.filter((msg) => msg.id !== payload.old.id)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, conversationType, queryClient, supabase])
} 