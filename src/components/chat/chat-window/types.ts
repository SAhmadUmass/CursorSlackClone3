import { Message } from '@/types'
import { ReactNode } from 'react'

export type ChatMode = 'dm' | 'channel' | 'ai'

export interface ChatWindowProps {
  conversationId: string
  mode: ChatMode
  initialMessages?: Message[]
  className?: string
}

export interface HeaderProps {
  mode: ChatMode
  title: string
  subtitle?: string
  icon?: ReactNode
  isOnline?: boolean
  memberCount?: number
}

export interface ChatWindowState {
  messages: Message[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  nextCursor: string | null
  title: string
  subtitle?: string
  isOnline?: boolean
  memberCount?: number
}

export interface MessageSubscriptionCallbacks {
  onNewMessage: (message: Message) => void
  onMessageUpdate: (message: Message) => void
  onMessageDelete: (messageId: string) => void
  onPresenceChange?: (userId: string, isOnline: boolean) => void
} 