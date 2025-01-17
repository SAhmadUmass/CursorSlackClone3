'use client'

import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'
import { JSX, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ConversationType, Message, MessageSource } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { useChatStore } from '@/lib/store/chat-store'

// Use a constant UUID for the AI user
const AI_USER_ID = '00000000-0000-0000-0000-000000000000'

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
  const { 
    user, 
    messages,
    setMessages,
    addMessage,
    updateMessageStatus,
    startAITyping, 
    stopAITyping, 
    updateAIMessage, 
    finalizeAIMessage,
    isAITyping 
  } = useChatStore()

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [message])

  // Handle AI message streaming
  const handleAIMessage = async () => {
    if (!message.trim() || isLoading || !user) return

    setIsLoading(true)

    // Create user message with status
    const userMessageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const userMessage: Message = {
      id: userMessageId,
      conversation_id: conversationId,
      conversation_type: mode,
      content: message.trim(),
      client_generated_id: userMessageId,
      created_at: timestamp,
      user_id: user.id,
      status: 'sending',
      user: {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Unknown User',
        avatar_url: user.user_metadata?.avatar_url || null,
      }
    }

    // Add message to store first
    addMessage(userMessage)
    setMessage('')

    try {
      // Save user message to Supabase
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          id: userMessageId,
          conversation_id: conversationId,
          conversation_type: mode,
          content: userMessage.content,
          client_generated_id: userMessageId,
          created_at: timestamp,
          user_id: user.id,
          sources: []
        })

      if (insertError) throw insertError
      updateMessageStatus(userMessageId, 'sent')

      // Start AI response
      startAITyping()

      // Start AI streaming
      const response = await fetch('/api/ai-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage.content, 
          conversation_id: conversationId 
        })
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to get AI response')
      }

      const reader = response.body.getReader()
      let sources: MessageSource[] = []
      let accumulatedMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)

        // First line contains sources
        if (!sources.length && chunk.includes('\n')) {
          const [sourcesJson, ...rest] = chunk.split('\n')
          sources = JSON.parse(sourcesJson).sources
          accumulatedMessage = rest.join('\n')
        } else {
          accumulatedMessage += chunk
        }

        // Update streaming message
        updateAIMessage(accumulatedMessage, sources)
      }

      // Save AI message to Supabase
      const aiMessageId = crypto.randomUUID()
      const aiMessage = {
        id: aiMessageId,
        conversation_id: conversationId,
        conversation_type: mode,
        content: accumulatedMessage,
        client_generated_id: aiMessageId,
        created_at: new Date().toISOString(),
        user_id: AI_USER_ID,
        sources: sources || []
      }

      const { error: aiError } = await supabase
        .from('messages')
        .insert(aiMessage)

      if (aiError) throw aiError

      // Finalize the message
      finalizeAIMessage(accumulatedMessage, sources)
      onMessageSent?.()

    } catch (error) {
      console.error('AI Chat Error:', error)
      updateMessageStatus(
        userMessageId, 
        'error', 
        error instanceof Error ? error.message : 'Failed to get AI response'
      )
      stopAITyping()
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sending regular message
  const handleRegularMessage = async () => {
    if (!message.trim() || isLoading || !user) return

    setIsLoading(true)
    const messageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    // Create message with sending status
    const newMessage: Message = {
      id: messageId,
      conversation_id: conversationId,
      conversation_type: mode,
      content: message.trim(),
      client_generated_id: messageId,
      created_at: timestamp,
      user_id: user.id,
      status: 'sending',
      user: {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Unknown User',
        avatar_url: user.user_metadata?.avatar_url || null,
      }
    }

    // Add message and clear input
    addMessage(newMessage)
    setMessage('')

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          conversation_type: mode,
          content: newMessage.content,
          client_generated_id: messageId,
          created_at: timestamp,
          user_id: user.id,
          sources: []
        })

      if (error) throw error
      
      // Update status to sent
      updateMessageStatus(messageId, 'sent')
      onMessageSent?.()
    } catch (err) {
      console.error('Failed to send message:', err)
      updateMessageStatus(
        messageId, 
        'error', 
        err instanceof Error ? err.message : 'Failed to send message'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Handle send based on mode
  const handleSend = () => {
    if (mode === 'ai') {
      handleAIMessage()
    } else {
      handleRegularMessage()
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
    <div className={cn(
      'p-4 border-t border-border',
      'bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      'sticky bottom-0',
      className
    )}>
      <div className={cn(
        'flex items-center gap-3',
        'relative',
        'max-w-3xl mx-auto'
      )}>
        {/* Message Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading || isAITyping}
          className={cn(
            'flex-1',
            'rounded-xl',
            'border border-border',
            'bg-background',
            'px-4 py-2.5',
            'text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'transition-all duration-200',
            'resize-none',
            'min-h-[42px]',
            'max-h-[200px]',
            'disabled:opacity-50',
            'disabled:cursor-not-allowed',
            'shadow-sm'
          )}
        />

        {/* Send Button (shown by default in AI mode) */}
        {mode === 'ai' && (
          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim() || isAITyping}
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
              'shadow-sm'
            )}
          >
            <span>{isLoading || isAITyping ? 'Thinking...' : 'Ask'}</span>
            <Bot className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Helper text for keyboard shortcuts */}
      <div className={cn(
        'text-xs text-muted-foreground/60',
        'mt-2',
        'text-center'
      )}>
        Press Enter to send, Shift + Enter for new line
      </div>
    </div>
  )
} 