'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DMChannel } from '@/types'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { MessageSquare } from 'lucide-react'

interface DMListProps {
  className?: string
  activeDMId?: string
}

export function DMList({ className, activeDMId }: DMListProps) {
  const [channels, setChannels] = useState<DMChannel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchDMs = async () => {
      try {
        const { data, error } = await supabase
          .from('dm_channels')
          .select(`
            *,
            user1:user1_id(*),
            user2:user2_id(*)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Get current user to determine other user in each DM
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        const transformedChannels = data.map((channel: any) => ({
          id: channel.id,
          created_at: channel.created_at,
          user1_id: channel.user1_id,
          user2_id: channel.user2_id,
          other_user: channel.user1.id === currentUser?.id ? channel.user2 : channel.user1
        }))

        setChannels(transformedChannels)
      } catch (error) {
        console.error('Error fetching DMs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDMs()

    // Subscribe to new DM channels
    const channel = supabase
      .channel('dm_channels')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dm_channels'
      }, () => {
        fetchDMs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (isLoading) {
    return (
      <div className={cn('space-y-2 p-2', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-12 rounded-md',
              'animate-pulse bg-muted'
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1 p-2', className)}>
      <div className="space-y-1">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => router.push(`/dm/${channel.id}`)}
            className={cn(
              'w-full',
              'flex items-center gap-3',
              'px-4 py-2',
              'hover:bg-accent/50',
              'transition-colors duration-200',
              'text-left',
              'group',
              activeDMId === channel.id && 'bg-accent/50'
            )}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-primary">
                {channel.other_user?.full_name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium truncate">
                  {channel.other_user?.full_name}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {channels.length === 0 && (
        <div className={cn(
          'flex flex-col items-center justify-center',
          'py-8 px-4',
          'text-center text-sm text-muted-foreground'
        )}>
          <MessageSquare className="h-8 w-8 mb-2 text-muted-foreground/50" />
          <p>No direct messages yet</p>
          <p className="text-xs">Start a conversation with someone!</p>
        </div>
      )}
    </div>
  )
} 