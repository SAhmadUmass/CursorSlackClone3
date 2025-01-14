'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { Message } from '@/types'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { ChevronDown, Check, Loader2, AlertCircle, ChevronUp } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button } from '@/components/ui/button'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  className?: string
}

interface MessageGroup {
  userId: string
  userName: string
  userAvatar: string | null
  messages: Message[]
  timestamp: string
}

export function MessageList({ 
  messages, 
  isLoading,
  onLoadMore,
  hasMore = false,
  className 
}: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  // Group messages by user and date
  const messageGroups = useMemo(() => {
    const groups: MessageGroup[] = []
    let currentGroup: MessageGroup | null = null

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at)
      const timestamp = getMessageTimestamp(messageDate)

      if (
        !currentGroup ||
        currentGroup.userId !== message.user_id ||
        currentGroup.timestamp !== timestamp
      ) {
        currentGroup = {
          userId: message.user_id,
          userName: message.user.full_name,
          userAvatar: message.user.avatar_url,
          messages: [],
          timestamp,
        }
        groups.push(currentGroup)
      }

      currentGroup.messages.push(message)
    })

    return groups
  }, [messages])

  // Handle scroll behavior
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const atBottom = scrollHeight - scrollTop - clientHeight < 50
      setAutoScroll(atBottom)
      setShowScrollToBottom(!atBottom)

      // Load more messages when scrolling to top
      if (scrollTop === 0 && hasMore && !isLoading && onLoadMore) {
        onLoadMore()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading, onLoadMore])

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages, autoScroll])

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      setAutoScroll(true)
      setShowScrollToBottom(false)
    }
  }

  return (
    <div className={cn('relative flex-1 overflow-hidden', className)}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-primary px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
            <span className="text-xs font-medium text-primary-foreground">Loading messages...</span>
          </div>
        </div>
      )}

      {/* Messages container */}
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto px-4 pt-4 space-y-6"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronUp className="h-3 w-3 mr-2" />
                  Load more
                </>
              )}
            </Button>
          </div>
        )}

        {/* Message groups */}
        {messageGroups.map((group, idx) => (
          <div key={`${group.userId}-${idx}`} className="space-y-2">
            <div className="flex items-center gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {group.userAvatar ? (
                  <img
                    src={group.userAvatar}
                    alt={group.userName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-primary">
                    {group.userName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm">{group.userName}</span>
                <span className="text-xs text-muted-foreground">{group.timestamp}</span>
              </div>
            </div>
            <div className="space-y-1 pl-10">
              {group.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'group relative',
                    'text-sm text-foreground',
                    'hover:bg-muted/50 rounded-md -mx-2 px-2 py-1 transition-colors'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  {message.status === 'sending' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground bg-background/80 backdrop-blur-sm px-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Sending</span>
                    </div>
                  )}
                  {message.status === 'sent' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                  )}
                  {message.status === 'error' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">Error sending message</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className={cn(
            'absolute bottom-4 right-4',
            'bg-primary text-primary-foreground',
            'rounded-full p-2',
            'shadow-lg',
            'hover:bg-primary/90',
            'transition-all duration-200',
            'flex items-center gap-2'
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function getMessageTimestamp(date: Date): string {
  if (isToday(date)) {
    return 'Today ' + format(date, 'h:mm a')
  }
  if (isYesterday(date)) {
    return 'Yesterday ' + format(date, 'h:mm a')
  }
  return format(date, 'MMM d, h:mm a')
}
