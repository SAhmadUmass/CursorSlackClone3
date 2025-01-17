'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { Message, MessageSource } from '@/types'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { ChevronDown, Check, Loader2, AlertCircle, Bot } from 'lucide-react'
import { useChatStore } from '@/lib/store/chat-store'

// Use a constant UUID for the AI user
const AI_USER_ID = '00000000-0000-0000-0000-000000000000'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

interface MessageGroup {
  userId: string
  userName: string
  userInitial: string
  messages: Message[]
  timestamp: string
}

// Helper function to format message time
function formatMessageTime(date: Date): string {
  if (isToday(date)) {
    return format(date, 'h:mm a')
  } else if (isYesterday(date)) {
    return 'Yesterday ' + format(date, 'h:mm a')
  } else {
    return format(date, 'MMM d, h:mm a')
  }
}

// Helper function to get minutes difference between two dates
function getMinutesDifference(date1: Date, date2: Date): number {
  return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60)
}

export function MessageList({ messages, isLoading }: MessageListProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isAITyping, currentAIMessage, currentAISources } = useChatStore()

  // Simple auto-scroll on new messages or AI typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentAIMessage])

  // Group messages
  const messageGroups = useMemo(() => {
    const groups: MessageGroup[] = []
    let currentGroup: MessageGroup | null = null

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at)
      const userName = message.user?.full_name || 'Unknown User'
      const userInitial = userName.charAt(0).toUpperCase()

      // Start a new group if:
      // 1. No current group
      // 2. Different user
      // 3. More than 5 minutes between messages
      if (!currentGroup || 
          currentGroup.userId !== message.user_id ||
          getMinutesDifference(new Date(currentGroup.messages[currentGroup.messages.length - 1].created_at), messageDate) > 5) {
        currentGroup = {
          userId: message.user_id,
          userName,
          userInitial,
          messages: [],
          timestamp: formatMessageTime(messageDate)
        }
        groups.push(currentGroup)
      }

      currentGroup.messages.push(message)
    })

    return groups
  }, [messages])

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col justify-end min-h-full">
        <div className="space-y-3 p-4">
          {messageGroups.map((group, groupIndex) => (
            <div key={`${group.userId}-${groupIndex}`} className={cn(
              'group relative',
              'animate-in fade-in-50 duration-500',
              'slide-in-from-bottom-4'
            )}>
              <div className={cn(
                'flex items-start gap-3',
                'px-3 py-2',
                'rounded-lg',
                'transition-colors duration-200',
                'hover:bg-accent/5 dark:hover:bg-accent/10',
                'group-hover:shadow-sm dark:group-hover:shadow-accent/5'
              )}>
                {/* Avatar */}
                <div className={cn(
                  'h-8 w-8 rounded-full',
                  'flex items-center justify-center',
                  'text-sm font-medium',
                  'ring-2 ring-background',
                  'transition-transform duration-200',
                  'group-hover:scale-105',
                  group.userId === AI_USER_ID
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                    : 'bg-secondary text-secondary-foreground'
                )}>
                  {group.userId === AI_USER_ID ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    group.userInitial
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Message Header */}
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={cn(
                      'font-semibold',
                      'text-foreground',
                      'hover:text-foreground/90',
                      'cursor-pointer'
                    )}>
                      {group.userName}
                    </span>
                    <span className={cn('text-xs', 'text-muted-foreground/80')}>
                      {group.timestamp}
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="space-y-1">
                    {group.messages.map((message) => (
                      <div key={message.id} className="flex items-start gap-2">
                        <div className={cn(
                          'flex-1',
                          'text-foreground/90',
                          'leading-normal',
                          'break-words'
                        )}>
                          {message.content}
                        </div>
                        {message.status && (
                          <div className="flex-shrink-0 self-end">
                            {message.status === 'sending' && (
                              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground/50" />
                            )}
                            {message.status === 'sent' && (
                              <Check className="w-3 h-3 text-muted-foreground/50" />
                            )}
                            {message.status === 'error' && (
                              <AlertCircle className="w-3 h-3 text-destructive/50" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming Message */}
          {isAITyping && currentAIMessage && (
            <div className={cn(
              'group relative',
              'animate-in fade-in-50 duration-500',
              'slide-in-from-bottom-4'
            )}>
              <div className={cn(
                'flex items-start gap-3',
                'px-3 py-2',
                'rounded-lg',
                'transition-colors duration-200',
                'hover:bg-accent/5 dark:hover:bg-accent/10',
                'group-hover:shadow-sm dark:group-hover:shadow-accent/5'
              )}>
                {/* AI Avatar */}
                <div className={cn(
                  'h-8 w-8 rounded-full',
                  'bg-primary/10 dark:bg-primary/20',
                  'flex items-center justify-center',
                  'text-sm font-medium text-primary',
                  'ring-2 ring-background',
                  'transition-transform duration-200',
                  'group-hover:scale-105'
                )}>
                  <Bot className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Message Header */}
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={cn(
                      'font-semibold',
                      'text-foreground',
                      'hover:text-foreground/90',
                      'cursor-pointer'
                    )}>
                      AI Assistant
                    </span>
                    <span className={cn('text-xs', 'text-muted-foreground/80', 'font-medium')}>
                      <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                      Typing...
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'flex-1',
                        'text-foreground/90',
                        'leading-normal',
                        'break-words'
                      )}>
                        {currentAIMessage}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} className="h-0" />
      </div>
    </div>
  )
}
