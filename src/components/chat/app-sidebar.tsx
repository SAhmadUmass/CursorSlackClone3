'use client'

import { FC, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { LogOut, Bot } from 'lucide-react'
import { ConversationChannelList } from './conversation-channel-list'
import { ConversationChannelCreate } from './conversation-channel-create'
import { ConversationDMList } from './conversation-dm-list'
import { ConversationDMCreate } from './conversation-dm-create'
import { Conversation } from '@/types'
import { useChatStore } from '@/lib/store/chat-store'
import { processConversations } from '@/lib/utils/conversations'

const AppSidebar: FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { conversations, setConversations, currentConversation, setCurrentConversation } = useChatStore()

  // Split conversations into channels and DMs
  const channels = conversations.filter(conv => conv.type === 'channel')
  const dms = conversations.filter(conv => conv.type === 'dm')

  // Extract conversation ID from pathname
  const activeDMId = pathname?.startsWith('/dm/') ? pathname.split('/')[2] : undefined

  // Fetch current user and conversations
  useEffect(() => {
    const fetchUserAndConversations = async () => {
      try {
        console.log('Fetching user session...')
        // Fetch user
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          console.error('Auth error:', sessionError)
          router.push('/sign-in')
          return
        }

        console.log('Session found:', session.user.email)
        setCurrentUser(session.user)

        // Fetch conversations
        console.log('Fetching conversations...')
        const response = await fetch('/api/conversations')
        const data = await response.json()
        
        if (response.ok) {
          const allConversations = processConversations(data)
          setConversations(allConversations)
        } else {
          console.error('Failed to fetch conversations:', data.error)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchUserAndConversations()

    // Set up auth state change listener
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/sign-in')
      } else if (session?.user) {
        setCurrentUser(session.user)
      }
    })

    // Set up real-time subscription for conversations
    const conversationChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        async () => {
          // Refetch conversations on any change
          console.log('Real-time update received, fetching conversations...')
          const response = await fetch('/api/conversations')
          const data = await response.json()
          if (response.ok) {
            const allConversations = processConversations(data)
            setConversations(allConversations)
          }
        }
      )
      .subscribe()

    return () => {
      authSubscription.unsubscribe()
      supabase.removeChannel(conversationChannel)
    }
  }, [supabase, setConversations, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      className={cn(
        'w-64 bg-card h-screen',
        'border-r border-border',
        'flex flex-col',
        'transition-all duration-200 ease-in-out'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold">Cursor Chat</h1>
      </div>

      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Channels</h2>
            <ConversationChannelCreate />
          </div>
          <ConversationChannelList
            channels={channels}
            currentChannel={currentConversation?.type === 'channel' ? currentConversation : null}
            onChannelSelect={setCurrentConversation}
          />
        </div>

        {/* DMs Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Direct Messages</h2>
            <ConversationDMCreate />
          </div>
          <ConversationDMList
            dms={dms}
            currentDM={currentConversation?.type === 'dm' ? currentConversation : null}
            onDMSelect={setCurrentConversation}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => router.push('/ai-chat')}
              className="p-2 hover:bg-accent rounded-md"
              title="AI Chat"
            >
              <Bot className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-accent rounded-md"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppSidebar
