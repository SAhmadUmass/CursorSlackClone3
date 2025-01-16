'use client'

import { cn } from '@/lib/utils'
import { Bot, Hash, User } from 'lucide-react'
import { HeaderProps } from './types'

export function ChatWindowHeader({
  mode,
  title,
  subtitle,
  isOnline,
  memberCount,
}: HeaderProps) {
  return (
    <div className="border-b px-4 py-2 flex-shrink-0 flex items-center gap-2">
      {/* Icon based on mode */}
      <div
        className={cn(
          'h-8 w-8 rounded-full',
          'flex items-center justify-center',
          mode === 'ai'
            ? 'bg-primary/10'
            : mode === 'dm'
            ? 'bg-secondary'
            : 'bg-muted'
        )}
      >
        {mode === 'ai' ? (
          <Bot className="h-4 w-4 text-primary" />
        ) : mode === 'dm' ? (
          <User className="h-4 w-4 text-secondary-foreground" />
        ) : (
          <Hash className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Title and Subtitle */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold truncate">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-3">
        {mode === 'dm' && (
          <p
            className={cn(
              'text-xs font-medium',
              isOnline ? 'text-green-500' : 'text-muted-foreground'
            )}
          >
            {isOnline ? 'Online' : 'Offline'}
          </p>
        )}
        {mode === 'channel' && memberCount !== undefined && (
          <p className="text-xs text-muted-foreground">
            {memberCount} member{memberCount === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  )
} 