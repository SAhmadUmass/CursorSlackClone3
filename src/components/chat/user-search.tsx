'use client'

import { useState } from 'react'
import { User } from '@/types'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface UserSearchProps {
  onSelect: (user: User) => void
  excludeUserId?: string
  className?: string
}

export function UserSearch({ onSelect, excludeUserId, className }: UserSearchProps) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([])
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('full_name', `%${searchQuery}%`)
        .neq('id', excludeUserId)
        .limit(5)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setQuery(value)
    searchUsers(value)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {users.length > 0 && (
        <ul className={cn(
          'rounded-md border bg-popover p-1',
          'shadow-md',
          'max-h-[300px] overflow-y-auto'
        )}>
          {users.map((user) => (
            <li key={user.id}>
              <button
                onClick={() => onSelect(user)}
                className={cn(
                  'w-full flex items-center gap-3',
                  'px-3 py-2 rounded-sm',
                  'text-sm',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors duration-200'
                )}
              >
                <div className={cn(
                  'h-8 w-8 rounded-full',
                  'bg-primary/10 dark:bg-primary/20',
                  'flex items-center justify-center',
                  'text-sm font-medium text-primary'
                )}>
                  {user.full_name.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground text-center py-2">
          Searching...
        </div>
      )}
    </div>
  )
} 