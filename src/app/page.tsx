'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/lib/store/chat-store'
import { Conversation } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useMessageSubscription } from '@/hooks/useMessageSubscription'
import AppSidebar from '@/components/chat/app-sidebar'
import { ChannelChatWindow } from '@/components/chat/conversations/channel/ChannelChatWindow'
import { DMChatWindow } from '@/components/chat/conversations/dm/DMChatWindow'
import { processConversations } from '@/lib/utils/conversations'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const {
    conversations,
    currentConversation,
    setConversations,
    setCurrentConversation,
  } = useChatStore()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        if (user) {
          setUser(user)
          await fetchConversations()
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      const data = await response.json()
      
      if (response.ok) {
        const allConversations = processConversations(data)
        setConversations(allConversations)
      } else {
        console.error('Error fetching conversations:', data.error)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

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
