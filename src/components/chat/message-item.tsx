import { Message } from '@/types'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { Check, Loader2, AlertCircle } from 'lucide-react'

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const timestamp = getMessageTimestamp(new Date(message.created_at))

  return (
    <div className="group space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {message.user.avatar_url ? (
            <img
              src={message.user.avatar_url}
              alt={message.user.full_name || ''}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-primary">
              {(message.user.full_name || 'U').charAt(0)}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm">{message.user.full_name || 'Unknown User'}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
      </div>
      <div
        className={cn(
          'relative pl-10',
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