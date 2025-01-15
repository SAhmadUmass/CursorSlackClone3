'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface UserSearchProps {
  onSelect: (user: User) => void
  excludeUserId?: string
  isLoading?: boolean
}

export function UserSearch({ onSelect, excludeUserId, isLoading = false }: UserSearchProps) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setUsers([])
        return
      }

      setSearchLoading(true)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url, created_at')
          .ilike('email', `%${query}%`)
          .neq('id', excludeUserId || '')
          .limit(10)

        if (error) throw error
        setUsers(data || [])
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setSearchLoading(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [query, excludeUserId, supabase])

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isLoading}
      />
      <div className="space-y-2">
        {users.map((user) => (
          <Button
            key={user.id}
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => onSelect(user)}
            disabled={isLoading}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="font-medium">{user.full_name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </Button>
        ))}
        {searchLoading && (
          <div className="text-sm text-muted-foreground text-center py-2">
            Searching...
          </div>
        )}
      </div>
    </div>
  )
}
