'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { LogOut } from 'lucide-react'
import { ChannelList } from './channel-list'
import { ChannelCreateModal } from './channel-create-modal'

export function AppSidebar() {
  const router = useRouter()
  const supabase = createClient()

  return (
    <div className={cn(
      'w-64 bg-card h-screen',
      'border-r border-border',
      'flex flex-col',
      'transition-all duration-200 ease-in-out'
    )}>
      {/* Header */}
      <div className={cn(
        'p-4 border-b border-border',
        'flex items-center justify-between'
      )}>
        <h1 className={cn(
          'text-xl font-bold tracking-tight',
          'text-foreground',
          'animate-in fade-in-50 duration-500'
        )}>
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

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn(
          'p-4',
          'animate-in fade-in-50 duration-500 delay-200'
        )}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Channels
            </h2>
          </div>

          <div className="space-y-4">
            <ChannelCreateModal />
            <ChannelList />
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className={cn(
        'p-4 border-t border-border',
        'bg-card/50',
        'animate-in fade-in-50 duration-500 delay-300'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-8 w-8 rounded-full',
            'bg-primary/10',
            'flex items-center justify-center',
            'text-sm font-medium text-primary'
          )}>
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              User Name
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Online
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 