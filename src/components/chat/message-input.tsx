'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'
import { ConversationType } from '@/types'

interface MessageInputProps {
  mode: ConversationType
  placeholder?: string
  isLoading?: boolean
  disabled?: boolean
  onSendMessage: (content: string) => Promise<void>
  className?: string
}

export function MessageInput({
  mode,
  placeholder,
  isLoading = false,
  disabled = false,
  onSendMessage,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [height, setHeight] = useState('auto')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = scrollHeight + 'px'
      setHeight(scrollHeight + 'px')
    }
  }, [message])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = async () => {
    if (!message.trim() || isLoading || disabled) return

    try {
      setMessage('') // Clear input immediately for better UX
      await onSendMessage(message.trim())
    } catch (error) {
      // Restore message if send fails
      setMessage(message)
      console.error('Failed to send message:', error)
    }
  }

  const defaultPlaceholder = mode === 'ai' 
    ? "Ask me anything about the conversation history..."
    : "Type a message..."

  return (
    <div
      className={cn(
        'p-4 border-t border-border',
        'bg-card/50 backdrop-blur-sm',
        'transition-colors duration-200',
        'animate-in fade-in-50',
        className
      )}
    >
      <div className={cn('flex items-end gap-3', 'relative')}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          disabled={isLoading || disabled}
          rows={1}
          style={{ height }}
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
            'disabled:opacity-50'
          )}
          aria-label="Message input"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled}
          className={cn(
            'px-4 py-2.5',
            'bg-primary text-primary-foreground',
            'rounded-xl',
            'font-medium',
            'hover:bg-primary/90',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            'flex items-center gap-2',
            'min-h-[42px]' // Match textarea min-height
          )}
          aria-label={isLoading ? 'Sending message...' : 'Send message'}
        >
          <span>{isLoading ? 'Sending...' : mode === 'ai' ? 'Ask' : 'Send'}</span>
          {mode === 'ai' && <Bot className="h-4 w-4" />}
        </button>
      </div>
      <div className={cn('text-xs text-muted-foreground/60', 'mt-2 ml-1')}>
        Press Enter to send, Shift + Enter for new line
      </div>
    </div>
  )
} 