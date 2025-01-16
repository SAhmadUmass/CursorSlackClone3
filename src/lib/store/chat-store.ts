import { create } from 'zustand'
import { Conversation, Message } from '@/types'

export type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface ChatStore {
  // Conversations
  conversations: Conversation[]
  setConversations: (conversations: Conversation[]) => void
  currentConversation: Conversation | null
  setCurrentConversation: (conversation: Conversation | null) => void
  
  // Messages
  messages: Message[]
  setMessages: (messagesOrUpdater: Message[] | ((messages: Message[]) => Message[])) => void
  addMessage: (message: Message) => void
  
  // User
  user: any | null
  setUser: (user: any | null) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  // Conversations
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  currentConversation: null,
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  
  // Messages
  messages: [],
  setMessages: (messagesOrUpdater) => set((state) => ({
    messages: typeof messagesOrUpdater === 'function' 
      ? messagesOrUpdater(state.messages)
      : messagesOrUpdater
  })),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  // User
  user: null,
  setUser: (user) => set({ user })
}))
