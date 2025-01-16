'use client'

import { useChatStore } from '@/lib/store/chat-store'
import { MessageList } from '@/components/chat/message-list'
import { MessageInput } from '@/components/chat/message-input'
import { ChatWindowHeader } from './header'
import { ChatWindowProps } from './types'
import { cn } from '@/lib/utils'

export function ChatWindow({
  conversationId,
  mode,
  initialMessages = [],
  className,
}: ChatWindowProps) {
  const { messages } = useChatStore()
  
  const title = mode === 'ai' ? 'AI Assistant' : 'Chat'
  const subtitle = mode === 'ai' ? 'Powered by ChatGPT with access to conversation history' : undefined

  return (
    <div className={cn('flex-1 flex flex-col h-full max-h-screen', className)}>
      {/* Header */}
      <ChatWindowHeader
        mode={mode}
        title={title}
        subtitle={subtitle}
      />

      {/* Messages */}
      <div className="flex-1 min-h-0">
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
            ? `Message ${title}`
            : `Message #${title}`
        }
      />
    </div>
  )
} 