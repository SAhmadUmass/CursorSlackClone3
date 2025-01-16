'use client'

import { JSX } from 'react'
import { Message } from '@/types'
import { ChatWindow } from '@/components/chat/chat-window'

interface DMChatWindowProps {
  conversationId: string
  initialMessages?: Message[]
  className?: string
}

export function DMChatWindow({
  conversationId,
  initialMessages,
  className,
}: DMChatWindowProps): JSX.Element {
  return (
    <ChatWindow
      mode="dm"
      conversationId={conversationId}
      initialMessages={initialMessages}
      className={className}
    />
  )
}
