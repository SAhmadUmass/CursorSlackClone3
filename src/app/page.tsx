'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/lib/store/chat-store'
import { Channel } from '@/types'
import { createClient } from '@/lib/supabase/client'
import AppSidebar from '@/components/chat/app-sidebar'
import { ChannelChatWindow } from '@/components/chat/channel/ChannelChatWindow'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const { channels, currentChannel, setChannels, setCurrentChannel } = useChatStore()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Fetch user on mount
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }
      setUser(user)
    }
    getUser()
  }, [router])

  // Fetch channels on mount
  useEffect(() => {
    async function fetchChannels() {
      try {
        const response = await fetch('/api/channels')
        const result = await response.json()

        if (result.success) {
          setChannels(result.data)
          // Set first channel as current if none selected
          if (!currentChannel && result.data.length > 0) {
            setCurrentChannel(result.data[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChannels()
  }, [])

  const handleChannelClick = (channel: Channel) => {
    setCurrentChannel(channel)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        channels={channels}
        currentChannel={currentChannel}
        onChannelSelect={handleChannelClick}
      />

      {/* Main Chat Area */}
      <div className="flex-1 h-screen overflow-hidden">
        {currentChannel ? (
          <ChannelChatWindow channel={currentChannel} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-lg text-muted-foreground">Select a channel to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
