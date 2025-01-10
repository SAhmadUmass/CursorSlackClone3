import { useMemo } from 'react'
import { Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Channel } from '@/types'
import { ChannelDeleteDialog } from './channel-delete-dialog'
import { ChannelInfoDialog } from './channel-info-dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface ChannelListProps {
  channels: Channel[]
  currentChannel: Channel | null
  onChannelSelect: (channel: Channel) => void
}

export const ChannelList = ({ channels, currentChannel, onChannelSelect }: ChannelListProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  const sortedChannels = useMemo(() => {
    return [...channels].sort((a, b) => a.name.localeCompare(b.name))
  }, [channels])

  return (
    <div className="space-y-1">
      {sortedChannels.map((channel) => {
        const isActive = currentChannel?.id === channel.id
        const canDelete = currentUserId && channel.created_by === currentUserId

        return (
          <div key={channel.id} className="group flex items-center gap-2 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChannelSelect(channel)}
              className={cn('w-full justify-start gap-2 rounded-md', isActive && 'bg-accent')}
            >
              <Hash className="h-4 w-4" />
              <span className="truncate">{channel.name}</span>
            </Button>
            {isActive && (
              <div className="flex items-center gap-1">
                <ChannelInfoDialog
                  channel={channel}
                  className="opacity-0 group-hover:opacity-100"
                />
                {canDelete && (
                  <ChannelDeleteDialog
                    channel={channel}
                    className="opacity-0 group-hover:opacity-100"
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
