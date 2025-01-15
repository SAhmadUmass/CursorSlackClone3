import { create } from 'zustand'
import { Conversation, Message } from '@/types'

interface ChatStore {
  conversations: Conversation[]
  setConversations: (conversations: Conversation[]) => void
  currentConversation: Conversation | null
  setCurrentConversation: (conversation: Conversation | null) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  currentConversation: null,
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] }))
}))
