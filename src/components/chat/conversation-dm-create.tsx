'use client'

import { FC, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UserSearch } from './user-search'
import { User } from '@/types'

export const ConversationDMCreate: FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClientComponentClient()

  const handleUserSelect = async (user: User) => {
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert([
          {
            type: 'dm',
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setIsOpen(false)
    } catch (error) {
      console.error('Error creating DM:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Direct Message</DialogTitle>
          <DialogDescription>
            Search for a user to start a conversation.
          </DialogDescription>
        </DialogHeader>
        <UserSearch onSelect={handleUserSelect} />
      </DialogContent>
    </Dialog>
  )
}
