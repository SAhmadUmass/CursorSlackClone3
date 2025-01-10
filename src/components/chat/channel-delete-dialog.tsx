import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { TrashIcon } from 'lucide-react'
import { useChatStore } from '@/lib/store/chat-store'
import { Channel } from '@/types'

interface ChannelDeleteDialogProps {
  channel: Channel
  className?: string
}

export const ChannelDeleteDialog = ({ channel, className }: ChannelDeleteDialogProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const deleteChannel = useChatStore((state) => state.deleteChannel)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/channels?id=${channel.id}`, {
        method: 'DELETE',
      })

      const { success, error } = await response.json()
      if (!success) throw new Error(error)

      deleteChannel(channel.id)
    } catch (error) {
      console.error('Failed to delete channel:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 hover:bg-destructive/90 hover:text-destructive-foreground ${className}`}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Channel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the channel &quot;{channel.name}&quot;? This action
            cannot be undone and all messages in this channel will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete Channel'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
