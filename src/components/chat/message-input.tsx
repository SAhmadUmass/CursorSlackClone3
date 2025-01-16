'use client'

import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'
import { JSX, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ConversationType, Message } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { useChatStore } from '@/lib/store/chat-store'

interface MessageInputProps {
  conversationId: string
  mode?: ConversationType
  className?: string
  onMessageSent?: () => void
  placeholder?: string
}

export function MessageInput({
  conversationId,
  mode = 'dm',
  className,
  onMessageSent,
  placeholder = mode === 'ai' ? 'Ask me anything...' : 'Type a message...',
}: MessageInputProps): JSX.Element {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()
  const { user, addMessage } = useChatStore()

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [message])

  // Handle sending message
  const handleSend = async () => {
    if (!message.trim() || isLoading || !user) return

    setIsLoading(true)
    const optimisticId = uuidv4()
    const timestamp = new Date().toISOString()

    // Create optimistic message
    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      conversation_type: mode,
      content: message.trim(),
      client_generated_id: optimisticId,
      created_at: timestamp,
      user_id: user.id,
      user: {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Unknown User',
        avatar_url: user.user_metadata?.avatar_url || null,
      }
    }

    // Add optimistic message to store
    addMessage(optimisticMessage)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          conversation_type: mode,
          content: message.trim(),
          client_generated_id: optimisticId,
          created_at: timestamp,
          user_id: user.id,
        })

      if (error) throw error
      
      setMessage('') // Clear on success
      onMessageSent?.() // Notify parent of successful send
    } catch (err) {
      console.error('Failed to send message:', err)
      // Note: We don't remove the optimistic message on error
      // The real-time subscription will handle syncing the correct state
    } finally {
      setIsLoading(false)
    }
  }

  // Handle keyboard events (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && message.trim()) {
        handleSend()
      }
    }
  }

  return (
    <div className={cn('p-4 border-t border-border', className)}>
      <div className={cn('flex items-center gap-3', 'relative')}>
        {/* Message Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            'flex-1',
            'rounded-xl',
            'border border-border',
            'bg-background/80',
            'px-4 py-2.5',
            'text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'transition-all duration-200',
            'resize-none',
            'min-h-[42px]',
            'max-h-[200px]',
            'disabled:opacity-50',
            'disabled:cursor-not-allowed'
          )}
        />

        {/* Send Button (shown by default in AI mode) */}
        {mode === 'ai' && (
          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            className={cn(
              'px-4 py-2.5',
              'bg-primary text-primary-foreground',
              'rounded-xl',
              'font-medium',
              'hover:bg-primary/90',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              'flex items-center gap-2'
            )}
          >
            <span>{isLoading ? 'Thinking...' : 'Ask'}</span>
            <Bot className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Helper text for keyboard shortcuts */}
      <div className={cn('text-xs text-muted-foreground/60', 'mt-2 ml-1')}>
        Press Enter to send, Shift + Enter for new line
      </div>
    </div>
  )
} 