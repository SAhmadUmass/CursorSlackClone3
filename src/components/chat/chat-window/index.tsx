'use client'

import { useChatStore } from '@/lib/store/chat-store'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { ChatWindowHeader } from './header'
import { ChatWindowProps } from './types'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

export function ChatWindow({
  conversationId,
  mode,
  initialMessages = [],
  className,
}: ChatWindowProps) {
  const { messages, setMessages } = useChatStore()
  const initialized = useRef(false)
  
  // Initialize messages only once when component first mounts
  useEffect(() => {
    if (!initialized.current && initialMessages.length > 0) {
      console.log('ChatWindow: Setting initial messages')
      setMessages([...initialMessages])
      initialized.current = true
    }
  }, []) // Remove dependencies to only run once on mount

  // Debug log when messages change
  useEffect(() => {
    console.log('ChatWindow: Current messages:', messages)
  }, [messages])
  
  const title = mode === 'ai' ? 'AI Assistant' : 'Chat'
  const subtitle = mode === 'ai' ? 'Powered by ChatGPT with access to conversation history' : undefined

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <ChatWindowHeader
        mode={mode}
        title={title}
        subtitle={subtitle}
      />

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative">
        <MessageList 
          messages={messages} 
          isLoading={false} 
        />
      </div>

      {/* Message Input */}
      <MessageInput
        conversationId={conversationId}
        mode={mode}
        placeholder={
          mode === 'ai'
            ? 'Ask me anything about the conversation history...'
            : mode === 'dm'
            ? 'Type a message...'
            : 'Type a message...'
        }
      />
    </div>
  )
} 