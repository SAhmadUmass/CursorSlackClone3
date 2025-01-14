import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Message, ConversationType } from '@/types'
import { useChatStore } from '@/lib/store/chat-store'

const MESSAGES_PER_PAGE = 50

interface FetchMessagesOptions {
  conversationId: string
  conversationType: ConversationType
  page?: number
}

export const useMessages = ({ conversationId, conversationType, page = 1 }: FetchMessagesOptions) => {
  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()
  const { addMessage, updateMessage, deleteMessage } = useChatStore()

  // Query for fetching messages
  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId, page],
    queryFn: async () => {
      // For AI chat, return empty array as messages are handled differently
      if (conversationType === 'ai') {
        return []
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:users(*)
        `)
        .eq('conversation_id', conversationId)
        .eq('conversation_type', conversationType)
        .order('created_at', { ascending: false })
        .range((page - 1) * MESSAGES_PER_PAGE, page * MESSAGES_PER_PAGE - 1)

      if (error) throw error
      return data as Message[]
    },
    staleTime: 1000 * 60, // 1 minute
  })

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: Omit<Message, 'id' | 'created_at' | 'user'> & { user_id: string }) => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (!user) throw new Error('User not authenticated')

      const messageWithUser = {
        ...newMessage,
        user: {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'Unknown User',
          avatar_url: user.user_metadata?.avatar_url || null,
        },
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageWithUser])
        .select(`
          *,
          user:users(*)
        `)
        .single()

      if (error) throw error
      return data as Message
    },
    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] })

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['messages', conversationId, page])

      // Optimistically update to the new value
      queryClient.setQueryData(['messages', conversationId, page], (old: Message[] = []) => {
        const optimisticMessage = {
          ...newMessage,
          id: 'temp-' + Date.now(),
          created_at: new Date().toISOString(),
        }
        return [optimisticMessage, ...old]
      })

      // Add to Zustand store for real-time updates
      addMessage(newMessage as Message)

      return { previousMessages }
    },
    onError: (err, newMessage, context) => {
      // Revert the optimistic update
      queryClient.setQueryData(['messages', conversationId, page], context?.previousMessages)
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
  })

  // Mutation for updating messages
  const updateMessageMutation = useMutation({
    mutationFn: async (messageUpdate: Partial<Message> & { id: string }) => {
      const { data, error } = await supabase
        .from('messages')
        .update(messageUpdate)
        .eq('id', messageUpdate.id)
        .select()
        .single()

      if (error) throw error
      return data as Message
    },
    onSuccess: (updatedMessage) => {
      updateMessage(updatedMessage)
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
  })

  // Mutation for deleting messages
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from('messages').delete().eq('id', messageId)
      if (error) throw error
      return messageId
    },
    onSuccess: (messageId) => {
      deleteMessage(messageId)
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
  })

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    sendMessage: sendMessageMutation.mutate,
    updateMessage: updateMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    isUpdating: updateMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
  }
} 