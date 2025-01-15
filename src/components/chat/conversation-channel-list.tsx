import { FC } from 'react'
import { useRouter } from 'next/navigation'
import { Conversation } from '@/types'
import { ConversationChannelDelete } from './conversation-channel-delete'
import { ConversationChannelInfo } from './conversation-channel-info'
import { cn } from '@/lib/utils'
import { Hash } from 'lucide-react'

interface ConversationChannelListProps {
  channels: Conversation[]
  currentChannel: Conversation | null
  onChannelSelect: (channel: Conversation) => void
  className?: string
}

export const ConversationChannelList: FC<ConversationChannelListProps> = ({
  channels,
  currentChannel,
  onChannelSelect,
  className,
}) => {
  const router = useRouter()

  return (
    <div className={cn('space-y-1', className)}>
      {channels.map((channel) => (
        <div
          key={channel.id}
          onClick={() => onChannelSelect(channel)}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md',
            'hover:bg-accent/50 transition-colors duration-200',
            'text-sm font-medium cursor-pointer',
            currentChannel?.id === channel.id && 'bg-accent/50'
          )}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onChannelSelect(channel)
            }
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="h-4 w-4 shrink-0" />
            <span className="truncate">{channel.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <ConversationChannelInfo channel={channel} />
            <ConversationChannelDelete channel={channel} />
          </div>
        </div>
      ))}
      {channels.length === 0 && (
        <p className="text-sm text-muted-foreground px-2">No channels yet</p>
      )}
    </div>
  )
}
