import { SupabaseClient } from '@supabase/supabase-js'
import { Message } from '@/types'

export function subscribeToMessages(
  supabase: SupabaseClient,
  conversationId: string,
  conversationType: 'channel' | 'dm',
  callbacks: {
    onInsert?: (message: Message) => void
    onUpdate?: (message: Message) => void
    onDelete?: (message: Message) => void
  }
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId} AND conversation_type=eq.${conversationType}`,
      },
      (payload) => callbacks.onInsert?.(payload.new as Message)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId} AND conversation_type=eq.${conversationType}`,
      },
      (payload) => callbacks.onUpdate?.(payload.new as Message)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId} AND conversation_type=eq.${conversationType}`,
      },
      (payload) => callbacks.onDelete?.(payload.old as Message)
    )
    .subscribe()
}
