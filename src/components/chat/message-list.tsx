'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/types'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/lib/store/chat-store'
import { MessageItem } from './message-item'

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages: storeMessages } = useChatStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [storeMessages])

  return (
    <div className={cn('flex-1 overflow-y-auto p-4', 'space-y-4')}>
      {storeMessages.map((message) => (
        <MessageItem key={message.client_generated_id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
