'use client'

import { JSX } from 'react'
import { ChatWindow } from '@/components/chat/chat-window'

export function AIChatWindow(): JSX.Element {
  return (
    <ChatWindow
      mode="ai"
      conversationId="ai-chat"
    />
  )
} 