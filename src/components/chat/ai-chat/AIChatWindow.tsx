'use client'

import { JSX } from 'react'
import { ChatWindow } from '@/components/chat/chat-window'
import { Message } from '@/types'

interface AIChatWindowProps {
  initialMessages?: Message[]
}

// Use a constant UUID for the AI chat conversation
const AI_CHAT_CONVERSATION_ID = 'c0f45d1a-e3b0-4939-a90f-6b1061ccb49e'

export function AIChatWindow({ initialMessages = [] }: AIChatWindowProps): JSX.Element {
  return (
    <ChatWindow
      mode="ai"
      conversationId={AI_CHAT_CONVERSATION_ID}
      initialMessages={initialMessages}
    />
  )
} 