import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Message, AIMessage, ConversationType } from '@/types'
import { MessageList } from '@/components/chat/message-list'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { Bot } from 'lucide-react'
import { MessageInput } from '@/components/chat/message-input'
import { useMessages } from '@/hooks/useMessages'
import { useMessageSubscription } from '@/hooks/useMessageSubscription'
import { useQueryClient } from '@tanstack/react-query'

interface ChatWindowProps {
  mode: ConversationType
  conversationId?: string
  initialMessages?: Message[]
  className?: string
  otherUser?: {
    id: string
    name: string
    isOnline?: boolean
  }
}

export function ChatWindow({ 
  mode, 
  conversationId = 'ai-chat', 
  initialMessages = [], 
  className,
  otherUser
}: ChatWindowProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()

  // Use our new React Query hooks
  const {
    messages,
    isLoading,
    sendMessage: sendMessageMutation,
    isSending,
  } = useMessages({
    conversationId,
    conversationType: mode,
    page: currentPage,
  })

  // Set up real-time subscription
  useMessageSubscription({
    conversationId,
    conversationType: mode,
  })

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    fetchUser()
  }, [supabase])

  // Handle loading more messages
  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1)
  }

  // Handle sending messages
  const handleSendMessage = async (messageContent: string) => {
    if (!currentUser) return

    const clientGeneratedId = uuidv4()

    if (mode === 'ai') {
      // Handle AI message sending
      try {
        // Create and add user message to cache
        const userMessage: Message = {
          id: clientGeneratedId,
          conversation_id: conversationId,
          conversation_type: mode,
          content: messageContent,
          created_at: new Date().toISOString(),
          user_id: currentUser.id,
          client_generated_id: clientGeneratedId,
          status: 'sent',
          user: {
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || 'Unknown User',
            avatar_url: null,
          },
        }

        // Add user message to cache
        queryClient.setQueryData<Message[]>(['messages', conversationId, currentPage], (old = []) => [
          userMessage,
          ...old,
        ])

        // Create AI message placeholder
        const aiMessageId = uuidv4()
        const aiMessage: AIMessage = {
          id: aiMessageId,
          conversation_id: conversationId,
          conversation_type: 'ai',
          content: '',
          created_at: new Date().toISOString(),
          user_id: 'ai',
          client_generated_id: aiMessageId,
          status: 'sending',
          isAI: true,
          sources: [],
          user: {
            id: 'ai',
            email: 'ai@chatgenius.com',
            full_name: 'AI Assistant',
            avatar_url: null,
          },
        }

        // Add AI message to cache
        queryClient.setQueryData<Message[]>(['messages', conversationId, currentPage], (old = []) => [
          aiMessage,
          ...old,
        ])

        // Send message to AI endpoint
        const response = await fetch('/api/ai-chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: messageContent }),
        })

        if (!response.ok) throw new Error('Failed to send message')

        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let aiResponseText = ''
        let sources: any[] = []
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

            // Update AI message in cache with new content
            queryClient.setQueryData<Message[]>(['messages', conversationId, currentPage], (old = []) => {
              return old.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      content: aiResponseText,
                      status: 'sent',
                      sources,
                    }
                  : msg
              )
            })
          }
        }
      } catch (error) {
        console.error('Error sending AI message:', error)
        // Update AI message with error status
        queryClient.setQueryData<Message[]>(['messages', conversationId, currentPage], (old = []) => {
          return old.map((msg) =>
            msg.id === clientGeneratedId
              ? { ...msg, status: 'error' as const }
              : msg
          )
        })
        throw error
      }
    } else {
      // Handle regular message sending using React Query mutation
      try {
        await sendMessageMutation({
          content: messageContent,
          user_id: currentUser.id,
          conversation_id: conversationId,
          conversation_type: mode,
          client_generated_id: clientGeneratedId,
        })
      } catch (error) {
        console.error('Error sending message:', error)
        throw error
      }
    }
  }

  // Combine initial messages with fetched messages for the first render
  const displayMessages = mode === 'ai' 
    ? [...initialMessages, ...messages]
    : messages

  // Calculate if there are more messages to load
  const hasMore = messages.length === 50 // Using MESSAGES_PER_PAGE constant

  return (
    <div className={cn('flex-1 flex flex-col', className)}>
      {/* Header */}
      <div className="border-b px-4 py-2 flex items-center gap-2">
        {mode === 'ai' ? (
          <>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">AI Assistant</h2>
              <p className="text-xs text-muted-foreground">
                Powered by ChatGPT with access to conversation history
              </p>
            </div>
          </>
        ) : (
          <div>
            <h2 className="font-semibold">{otherUser?.name}</h2>
            <p className={cn(
              'text-xs',
              otherUser?.isOnline ? 'text-green-500' : 'text-muted-foreground'
            )}>
              {otherUser?.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <MessageList 
        messages={displayMessages} 
        isLoading={isLoading}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />

      {/* Message Input */}
      <MessageInput
        mode={mode}
        isLoading={isSending}
        placeholder={mode === 'ai' 
          ? "Ask me anything about the conversation history..." 
          : `Message ${otherUser?.name}`
        }
        onSendMessage={handleSendMessage}
      />
    </div>
  )
} 