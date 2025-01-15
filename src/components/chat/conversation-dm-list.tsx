'use client'

import { FC } from 'react'
import { useRouter } from 'next/navigation'
import { Conversation } from '@/types'
import { cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

interface ConversationDMListProps {
  dms: Conversation[]
  currentDM: Conversation | null
  onDMSelect: (dm: Conversation) => void
  className?: string
}

export const ConversationDMList: FC<ConversationDMListProps> = ({
  dms,
  currentDM,
  onDMSelect,
  className,
}) => {
  const router = useRouter()

  return (
    <div className={cn('space-y-1', className)}>
      {dms.map((dm) => (
        <button
          key={dm.id}
          onClick={() => onDMSelect(dm)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md',
            'hover:bg-accent/50 transition-colors duration-200',
            'text-sm font-medium',
            currentDM?.id === dm.id && 'bg-accent/50'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="truncate">{dm.name || 'Direct Message'}</span>
        </button>
      ))}
      {dms.length === 0 && (
        <p className="text-sm text-muted-foreground px-2">No direct messages yet</p>
      )}
    </div>
  )
}
