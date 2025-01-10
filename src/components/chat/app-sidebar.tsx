'use client'

import { FC, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { LogOut } from 'lucide-react'
import { ChannelList } from './channel-list'
import { ChannelCreateModal } from './channel-create-modal'
import { DMList } from './dm-list'
import { DMCreate } from './dm-create'
import { Channel } from '@/types'

export interface AppSidebarProps {
  channels: Channel[]
  currentChannel: Channel | null
  onChannelSelect: (channel: Channel) => void
}

const AppSidebar: FC<AppSidebarProps> = ({ channels, currentChannel, onChannelSelect }) => {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Extract channel ID from pathname
  const activeDMId = pathname?.startsWith('/dm/') ? pathname.split('/')[2] : undefined

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    fetchUser()
  }, [supabase])

  return (
    <div
      className={cn(
        'w-64 bg-card h-screen',
        'border-r border-border',
        'flex flex-col',
        'transition-all duration-200 ease-in-out'
      )}
    >
      {/* Header */}
      <div className={cn('p-4 border-b border-border', 'flex items-center justify-between')}>
        <h1
          className={cn(
            'text-xl font-bold tracking-tight',
            'text-foreground',
            'animate-in fade-in-50 duration-500'
          )}
        >
          ChatGenius
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={async () => {
              try {
                await supabase.auth.signOut()
                router.push('/sign-in')
              } catch (error) {
                console.error('Error signing out:', error)
              }
            }}
            className={cn(
              'p-2 rounded-md',
              'text-muted-foreground hover:text-foreground',
              'bg-transparent hover:bg-accent',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Direct Messages Section */}
        <div className={cn('p-4', 'animate-in fade-in-50 duration-500 delay-100')}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Direct Messages
            </h2>
          </div>

          <div className="space-y-4">
            <DMCreate />
            <DMList activeDMId={activeDMId} />
          </div>
        </div>

        {/* Channels Section */}
        <div className={cn('p-4', 'animate-in fade-in-50 duration-500 delay-200')}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Channels
            </h2>
          </div>

          <div className="space-y-4">
            <ChannelCreateModal />
            <ChannelList channels={channels} currentChannel={currentChannel} onChannelSelect={onChannelSelect} />
          </div>
        </div>
      </div>

      {/* User Section */}
      <div
        className={cn(
          'p-4 border-t border-border',
          'bg-card/50',
          'animate-in fade-in-50 duration-500 delay-300'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-8 w-8 rounded-full',
              'bg-primary/10',
              'flex items-center justify-center',
              'text-sm font-medium text-primary'
            )}
          >
            {currentUser?.user_metadata?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {currentUser?.user_metadata?.full_name || 'Loading...'}
            </p>
            <p className="text-xs text-muted-foreground truncate">Online</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppSidebar
