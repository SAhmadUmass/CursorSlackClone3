import { Conversation } from '@/types'

interface ConversationsResponse {
  channels: Conversation[]
  dms: Conversation[]
}

export const processConversations = (data: ConversationsResponse | null): Conversation[] => {
  if (!data) return []
  
  const channels = (data.channels || []).map(channel => ({
    ...channel,
    type: 'channel' as const
  }))
  
  const dms = (data.dms || []).map(dm => ({
    ...dm,
    type: 'dm' as const
  }))
  
  return [...channels, ...dms]
} 