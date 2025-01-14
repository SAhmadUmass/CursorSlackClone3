'use client'

import { useEffect, useState } from 'react'
import { Message } from '@/types'
import { ChatWindow } from '@/components/chat/chat-window'

const WELCOME_MESSAGE: Message = {
  id: 'welcome-message',
  conversation_id: 'ai-chat',
  conversation_type: 'ai',
  user_id: 'ai',
  content: `Hi! I'm your AI assistant. I can help you search through and understand past conversations in this chat. 

Some things you can ask me:
• Find messages about specific topics
• Summarize past discussions
• Find what someone said about a particular subject
• Look up previous decisions or agreements

How can I help you today?`,
  created_at: new Date().toISOString(),
  client_generated_id: 'welcome-message',
  user: {
    id: 'ai',
    email: 'ai@chatgenius.com',
    full_name: 'AI Assistant',
    avatar_url: null,
  },
}

export function AIChatWindow() {
  return (
    <ChatWindow
      mode="ai"
      initialMessages={[WELCOME_MESSAGE]}
    />
  )
} 