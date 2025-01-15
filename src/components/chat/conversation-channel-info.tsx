import { FC } from 'react'
import { Conversation } from '@/types'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConversationChannelInfoProps {
  channel: Conversation
  className?: string
}

export const ConversationChannelInfo: FC<ConversationChannelInfoProps> = ({ channel, className }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-6 w-6', 'hover:bg-accent', className)}
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About #{channel.name}</DialogTitle>
          <DialogDescription>
            {channel.description || 'No description available.'}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
