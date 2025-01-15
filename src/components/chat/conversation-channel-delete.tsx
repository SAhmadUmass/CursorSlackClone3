import { FC, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Conversation } from '@/types'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
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

interface ConversationChannelDeleteProps {
  channel: Conversation
  className?: string
}

export const ConversationChannelDelete: FC<ConversationChannelDeleteProps> = ({ channel, className }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClientComponentClient()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const { error } = await supabase.from('conversations').delete().eq('id', channel.id)
      if (error) throw error
    } catch (error) {
      console.error('Error deleting channel:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-6 w-6', 'hover:bg-destructive/10 hover:text-destructive', className)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Channel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the channel "{channel.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
