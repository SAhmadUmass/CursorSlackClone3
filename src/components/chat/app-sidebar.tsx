'use client'

import { FC } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'
import { LogOut, Bot } from 'lucide-react'
import { ConversationChannelList } from './conversation-channel-list'
import { ConversationChannelCreate } from './conversation-channel-create'
import { ConversationDMList } from './conversation-dm-list'
import { ConversationDMCreate } from './conversation-dm-create'
import { useChatStore } from '@/lib/store/chat-store'

const AppSidebar: FC = () => {
  const router = useRouter()
  const { conversations, currentConversation, setCurrentConversation, setUser } = useChatStore()

  // Split conversations into channels and DMs
  const channels = conversations.filter(conv => conv.type === 'channel')
  const dms = conversations.filter(conv => conv.type === 'dm')

  const handleSignOut = () => {
    setUser(null)
    router.push('/auth/sign-in')
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
