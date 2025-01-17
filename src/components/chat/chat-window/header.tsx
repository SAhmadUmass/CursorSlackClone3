'use client'

import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'
import { ConversationType } from '@/types'

interface ChatWindowHeaderProps {
  mode: ConversationType
  title: string
  subtitle?: string
}

export function ChatWindowHeader({
  mode,
  title,
  subtitle,
}: ChatWindowHeaderProps) {
  return (
    <div className={cn(
      'p-4 border-b border-border',
      'bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      'sticky top-0 z-10'
    )}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'h-8 w-8 rounded-full',
          'bg-primary/10 dark:bg-primary/20',
          'flex items-center justify-center',
          'text-sm font-medium text-primary'
        )}>
          {mode === 'ai' ? (
            <Bot className="w-4 h-4" />
          ) : (
            '#'
          )}
        </div>

        {/* Title and Subtitle */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 