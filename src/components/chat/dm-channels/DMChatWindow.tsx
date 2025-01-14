'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DMChannel, Message } from '@/types'
import { ChatWindow } from '@/components/chat/chat-window'
import { cn } from '@/lib/utils'

interface DMChatWindowProps {
  channelId: string
  initialMessages?: Message[]
  className?: string
}

export function DMChatWindow({ channelId, initialMessages = [], className }: DMChatWindowProps) {
  const [otherUser, setOtherUser] = useState<{ id: string; name: string; isOnline: boolean } | null>(null)
  const supabase = createClientComponentClient()

  // Fetch DM channel info
  useEffect(() => {
    const fetchDMChannel = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get DM channel and other user's info
        const { data: channel } = await supabase
          .from('conversations')
          .select(
            `
            *,
            user1:user1_id(*),
            user2:user2_id(*)
          `
          )
          .eq('id', channelId)
          .eq('type', 'dm')
          .single()

        if (channel) {
          const otherUserData = channel.user1.id === user.id ? channel.user2 : channel.user1
          setOtherUser({
            id: otherUserData.id,
            name: otherUserData.full_name,
            isOnline: false // Will be updated by subscription
          })
        }
      } catch (error) {
        console.error('Error fetching DM channel:', error)
      }
    }

    fetchDMChannel()
  }, [channelId, supabase])

  // Set up presence subscription for online status
  useEffect(() => {
    if (!otherUser?.id) return

    const channel = supabase.channel(`presence:${otherUser.id}`)
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const isOnline = Object.keys(presenceState).length > 0
        setOtherUser(prev => prev ? { ...prev, isOnline } : null)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [otherUser?.id, supabase])

  if (!otherUser) return null

  return (
    <ChatWindow
      mode="dm"
      conversationId={channelId}
      initialMessages={initialMessages}
      className={className}
      otherUser={otherUser}
    />
  )
}
