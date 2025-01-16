'use client'

import { JSX } from 'react'
import { Message } from '@/types'
import { ChatWindow } from '@/components/chat/chat-window'

interface ChannelChatWindowProps {
  conversationId: string
  initialMessages?: Message[]
  className?: string
}

export function ChannelChatWindow({
  conversationId,
  initialMessages,
  className,
}: ChannelChatWindowProps): JSX.Element {
  return (
    <ChatWindow
      mode="channel"
      conversationId={conversationId}
      initialMessages={initialMessages}
      className={className}
    />
  )
} 