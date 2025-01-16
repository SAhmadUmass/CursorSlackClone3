'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useChatStore } from '@/lib/store/chat-store'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import AppSidebar from '@/components/chat/app-sidebar'
import { ChannelChatWindow } from '@/components/chat/conversations/channel/ChannelChatWindow'
import { DMChatWindow } from '@/components/chat/conversations/dm/DMChatWindow'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const { currentConversation, setUser } = useChatStore()

  // Set up real-time subscriptions
  useSubscriptions()

  // Authentication effect
  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/auth/sign-in')
          return
        }

        if (mounted) {
          setUser(user)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/auth/sign-in')
      }
    }

    fetchUser()

    return () => {
      mounted = false
    }
  }, []) // Empty dependency array - runs once on mount

  return (
    <div className="flex h-screen">
      <AppSidebar />
      
      <main className="flex-1 flex flex-col">
        {currentConversation ? (
          currentConversation.type === 'channel' ? (
            <ChannelChatWindow
              conversationId={currentConversation.id}
              className="flex-1"
            />
          ) : (
            <DMChatWindow
              conversationId={currentConversation.id}
              className="flex-1"
            />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Welcome to Chat</h2>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
