'use client'

import { Channel } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface AppSidebarProps {
  channels: Channel[]
  currentChannel: Channel | null
  onChannelSelect: (channel: Channel) => void
}

export function AppSidebar({
  channels,
  currentChannel,
  onChannelSelect,
}: AppSidebarProps) {
  const router = useRouter()
  const supabase = createClient()

  return (
    <div className="w-64 bg-background border-r p-4">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-xl font-bold">ChatGenius</h1>
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
            className="px-2 py-1 text-sm bg-muted hover:bg-muted/80 rounded"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      <nav>
        <div className="mb-4">
          <h2 className="text-muted-foreground text-sm font-semibold mb-2">Channels</h2>
          <ul className="space-y-1">
            {channels.map((channel) => (
              <li
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                className={`px-2 py-1 rounded cursor-pointer ${
                  currentChannel?.id === channel.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50 hover:text-accent-foreground'
                }`}
              >
                # {channel.name}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  )
} 