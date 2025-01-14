import { useMessageSubscription } from './useMessageSubscription'
import { DMChannel, Message } from '@/types'

interface UseDMSubscriptionProps {
  userId: string
  channelId?: string
  onNewChannel?: (channel: DMChannel) => void
  onChannelUpdate?: (channel: DMChannel) => void
  onNewMessage?: (message: Message) => void
  onMessageUpdate?: (message: Message) => void
  onPresenceChange?: (userId: string, isOnline: boolean) => void
}

/**
 * @deprecated Use useMessageSubscription instead. Example:
 * ```ts
 * useMessageSubscription({
 *   conversationId: channelId,
 *   conversationType: 'dm',
 *   onNewMessage: (message) => {},
 *   onMessageUpdate: (message) => {},
 *   onMessageDelete: (messageId) => {},
 * })
 * ```
 */
export function useDMSubscription({
  userId,
  channelId,
  onNewChannel,
  onChannelUpdate,
  onNewMessage,
  onMessageUpdate,
  onPresenceChange,
}: UseDMSubscriptionProps) {
  console.warn(
    'useDMSubscription is deprecated. Please use useMessageSubscription instead. ' +
    'See documentation for migration instructions.'
  )

  // Use the new hook internally for message subscriptions
  const { status } = useMessageSubscription({
    conversationId: channelId || '',
    conversationType: 'dm',
    onNewMessage,
    onMessageUpdate,
  })

  // For backwards compatibility, map connection status to presence
  if (onPresenceChange && status) {
    onPresenceChange(userId, status === 'connected')
  }

  return {
    status,
  }
}
