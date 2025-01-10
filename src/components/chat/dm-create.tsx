'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UserSearch } from './user-search'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MessageSquarePlus } from 'lucide-react'

interface DMCreateProps {
  className?: string
}

export function DMCreate({ className }: DMCreateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [supabase])

  const handleUserSelect = async (selectedUser: User) => {
    setIsLoading(true)
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create or get existing DM channel
      const { data, error } = await fetch('/api/dm-channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          other_user_id: selectedUser.id,
        }),
      }).then((res) => res.json())

      if (error) throw error

      // Close dialog and navigate to DM
      setIsOpen(false)
      router.push(`/dm/${data.id}`)
    } catch (error) {
      console.error('Error creating DM:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full justify-start gap-2', 'text-muted-foreground', className)}
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>New Message</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <UserSearch onSelect={handleUserSelect} excludeUserId={currentUserId || undefined} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
