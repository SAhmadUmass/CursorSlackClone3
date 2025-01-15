'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { Message } from '@/types'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react'

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

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check scroll position to show/hide button
  const handleScroll = () => {
    if (!containerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Message grouping logic
  const messageGroups = useMemo(() => {
    const groups: MessageGroup[] = []
    let currentGroup: MessageGroup | undefined = undefined

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at)
      const userName = message.user?.full_name || 'Unknown User'
      const userInitial = userName.charAt(0)

      // Format timestamp
      const timestamp = formatMessageTime(messageDate)

      // Check if we should start a new group
      const shouldStartNewGroup =
        !currentGroup ||
        currentGroup.userId !== message.user_id ||
        getMinutesDifference(
          new Date(currentGroup.messages[currentGroup.messages.length - 1].created_at),
          messageDate
        ) > 5

      if (shouldStartNewGroup) {
        currentGroup = {
          userId: message.user_id,
          userName,
          userInitial,
          messages: [message],
          timestamp,
        }
        groups.push(currentGroup)
      } else if (currentGroup) {
        currentGroup.messages.push(message)
      }
    })

    return groups
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn('flex items-start gap-3', 'animate-pulse')}>
            {/* Avatar Skeleton */}
            <div className={cn('h-8 w-8 rounded-full', 'bg-muted')} />

            <div className="flex-1 space-y-2">
              {/* Header Skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-12 bg-muted rounded" />
              </div>
              {/* Message Skeleton */}
              <div className="space-y-1">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        'flex-1 overflow-y-auto',
        'px-4 py-4',
        'space-y-4',
        'bg-background/50',
        'relative',
        'h-full max-h-[calc(100vh-8rem)]'
      )}
    >
      {messageGroups.map((group, index) => (
        <div
          key={group.messages[0].id}
          className={cn(
            'group relative',
            'animate-in fade-in-50 duration-500',
            index === 0 ? 'slide-in-from-bottom-4' : ''
          )}
        >
          <div
            className={cn(
              'flex items-start gap-3',
              'px-3 py-2',
              'rounded-lg',
              'transition-colors duration-200',
              'hover:bg-accent/5 dark:hover:bg-accent/10',
              'group-hover:shadow-sm dark:group-hover:shadow-accent/5'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'h-8 w-8 rounded-full',
                'bg-primary/10 dark:bg-primary/20',
                'flex items-center justify-center',
                'text-sm font-medium text-primary',
                'ring-2 ring-background',
                'transition-transform duration-200',
                'group-hover:scale-105'
              )}
            >
              {group.userInitial}
            </div>

            <div className="flex-1 min-w-0">
              {/* Message Header */}
              <div className="flex items-baseline gap-2 mb-0.5">
                <span
                  className={cn(
                    'font-semibold',
                    'text-foreground',
                    'hover:text-foreground/90',
                    'cursor-pointer'
                  )}
                >
                  {group.userName}
                </span>
                <span className={cn('text-xs', 'text-muted-foreground/80', 'font-medium')}>
                  {group.timestamp}
                </span>
              </div>

              {/* Message Content */}
              <div className="space-y-1">
                {group.messages.map((message, messageIndex) => (
                  <div key={message.id} className="flex items-start gap-2">
                    <div
                      className={cn(
                        'flex-1',
                        'text-foreground/90',
                        'leading-normal',
                        'break-words',
                        messageIndex === group.messages.length - 1 ? 'pb-0.5' : ''
                      )}
                    >
                      {message.content}
                    </div>
                    {/* Message Status */}
                    <div
                      className={cn(
                        'flex items-center',
                        'text-xs',
                        message.status === 'error'
                          ? 'text-destructive'
                          : 'text-muted-foreground/60',
                        'transition-opacity duration-200',
                        'opacity-0 group-hover:opacity-100'
                      )}
                    >
                      {message.status === 'sending' && <Loader2 className="w-3 h-3 animate-spin" />}
                      {message.status === 'sent' && <Check className="w-3 h-3" />}
                      {message.status === 'error' && <AlertCircle className="w-3 h-3" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={cn(
            'absolute bottom-4 right-4',
            'p-2 rounded-full',
            'bg-primary text-primary-foreground',
            'shadow-lg',
            'hover:bg-primary/90',
            'transition-all duration-200',
            'animate-in fade-in-50 slide-in-from-bottom-4',
            'flex items-center gap-2'
          )}
        >
          <ChevronDown className="w-4 h-4" />
          <span className="text-sm font-medium">Latest</span>
        </button>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

// Helper function to format message time
function formatMessageTime(date: Date): string {
  if (isToday(date)) {
    return format(date, 'h:mm a')
  } else if (isYesterday(date)) {
    return 'Yesterday at ' + format(date, 'h:mm a')
  } else {
    return format(date, 'MMM d, h:mm a')
  }
}

// Helper function to get minutes difference between two dates
function getMinutesDifference(date1: Date, date2: Date): number {
  return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60)
}
