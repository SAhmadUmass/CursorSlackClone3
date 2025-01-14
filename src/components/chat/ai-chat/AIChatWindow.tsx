'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Message, AIMessage, MessageSource } from '@/types'
import { MessageList } from '@/components/chat/message-list'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { Bot } from 'lucide-react'

const WELCOME_MESSAGE = `Hi! I'm your AI assistant. I can help you search through and understand past conversations in this chat. 

Some things you can ask me:
• Find messages about specific topics
• Summarize past discussions
• Find what someone said about a particular subject
• Look up previous decisions or agreements

How can I help you today?`

export function AIChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClientComponentClient()

  // Add welcome message when component mounts
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome-message',
      content: WELCOME_MESSAGE,
      created_at: new Date().toISOString(),
      user_id: 'ai',
      user: {
        id: 'ai',
        email: 'ai@chatgenius.com',
        full_name: 'AI Assistant',
        avatar_url: null,
      },
    }
    setMessages([welcomeMessage])
  }, [])

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    fetchUser()
  }, [supabase])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return

    const clientGeneratedId = uuidv4()
    const messageContent = newMessage
    setNewMessage('') // Clear input immediately

    // Create temporary user message
    const tempUserMessage: Message = {
      id: clientGeneratedId,
      content: messageContent,
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      client_generated_id: clientGeneratedId,
      status: 'sending',
      user: {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.user_metadata?.full_name || 'Unknown User',
        avatar_url: null,
      },
    }

    // Add user message to the list (append at end)
    setMessages((prev) => [...prev, tempUserMessage])
    setIsLoading(true)

    try {
      // Send message to AI
      const response = await fetch('/api/ai-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: messageContent }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      // Create AI response message
      const aiMessageId = uuidv4()
      const aiMessage: AIMessage = {
        id: aiMessageId,
        content: '', // Will be filled by streaming response
        created_at: new Date().toISOString(),
        user_id: 'ai',
        client_generated_id: aiMessageId,
        status: 'sending',
        isAI: true,
        sources: [], // Will be filled with source citations
        user: {
          id: 'ai',
          email: 'ai@chatgenius.com',
          full_name: 'AI Assistant',
          avatar_url: null,
        },
      }

      // Add AI message to list (append at end)
      setMessages((prev) => [...prev, aiMessage])

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiResponseText = ''
      let sources: MessageSource[] = []
      let isFirstChunk = true

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          
          // Handle first chunk containing sources
          if (isFirstChunk) {
            isFirstChunk = false
            try {
              const newlineIndex = chunk.indexOf('\n')
              if (newlineIndex !== -1) {
                const sourcesJson = chunk.slice(0, newlineIndex)
                const remainingText = chunk.slice(newlineIndex + 1)
                const { sources: parsedSources } = JSON.parse(sourcesJson)
                sources = parsedSources
                aiResponseText += remainingText
              }
            } catch (e) {
              console.error('Error parsing sources:', e)
              aiResponseText += chunk
            }
          } else {
            aiResponseText += chunk
          }

          // Update AI message with accumulated response and sources
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { 
                    ...msg, 
                    content: aiResponseText, 
                    status: 'sent' as const,
                    sources 
                  }
                : msg
            )
          )
        }
      }

      // Update user message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.client_generated_id === clientGeneratedId
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
      // Update message with error status and message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.client_generated_id === clientGeneratedId
            ? { 
                ...msg, 
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Failed to send message'
              }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-2 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">AI Assistant</h2>
          <p className="text-xs text-muted-foreground">
            Powered by ChatGPT with access to conversation history
          </p>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Message Input */}
      <div className={cn(
        'p-4 border-t border-border',
        'bg-card/50 backdrop-blur-sm',
        'transition-colors duration-200',
        'animate-in fade-in-50 duration-500'
      )}>
        <div className={cn('flex items-center gap-3', 'relative')}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Ask me anything about the conversation history..."
            className={cn(
              'flex-1',
              'rounded-xl',
              'border border-border',
              'bg-background/80',
              'px-4 py-2.5',
              'text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'transition-all duration-200'
            )}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
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
        </div>
        <div className={cn('text-xs text-muted-foreground/60', 'mt-2 ml-1')}>
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  )
} 