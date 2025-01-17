import { create } from 'zustand'
import { Conversation, Message, MessageSource } from '@/types'

export type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// Use a constant UUID for the AI user and conversation
const AI_USER_ID = '00000000-0000-0000-0000-000000000000'
const AI_CHAT_CONVERSATION_ID = 'c0f45d1a-e3b0-4939-a90f-6b1061ccb49e'

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
  updateMessage: (message: Message) => void
  deleteMessage: (message: Message) => void
  updateMessageStatus: (clientGeneratedId: string, status: 'sending' | 'sent' | 'error', error?: string) => void
  
  // AI Streaming
  isAITyping: boolean
  currentAIMessage: string
  currentAISources: MessageSource[]
  startAITyping: () => void
  stopAITyping: () => void
  updateAIMessage: (content: string, sources: MessageSource[]) => void
  finalizeAIMessage: (content: string, sources: MessageSource[]) => void
  
  // User
  user: any | null
  setUser: (user: any | null) => void
  
  // Subscription Status
  subscriptionStatuses: Record<string, SubscriptionStatus>
  setSubscriptionStatus: (conversationId: string, status: SubscriptionStatus) => void
  getSubscriptionStatus: (conversationId: string) => SubscriptionStatus
}

export const useChatStore = create<ChatStore>((set, get) => ({
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
      : [...messagesOrUpdater]
  })),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  updateMessage: (message) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.id === message.id ? message : msg
    )
  })),
  deleteMessage: (message) => set((state) => ({
    messages: state.messages.filter(msg => msg.id !== message.id)
  })),
  updateMessageStatus: (clientGeneratedId, status, error) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.client_generated_id === clientGeneratedId
        ? { ...msg, status, error }
        : msg
    )
  })),
  
  // AI Streaming
  isAITyping: false,
  currentAIMessage: '',
  currentAISources: [],
  startAITyping: () => set({ isAITyping: true }),
  stopAITyping: () => set({ 
    isAITyping: false, 
    currentAIMessage: '', 
    currentAISources: [] 
  }),
  updateAIMessage: (content, sources) => set({ 
    currentAIMessage: content, 
    currentAISources: sources 
  }),
  finalizeAIMessage: (content, sources) => set((state) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: AI_CHAT_CONVERSATION_ID,
      conversation_type: 'ai',
      content,
      sources,
      created_at: new Date().toISOString(),
      user_id: AI_USER_ID,
      client_generated_id: crypto.randomUUID(),
      user: {
        id: AI_USER_ID,
        email: 'ai@assistant.com',
        full_name: 'AI Assistant',
        avatar_url: null
      }
    }
    
    return {
      messages: [...state.messages, newMessage],
      isAITyping: false,
      currentAIMessage: '',
      currentAISources: []
    }
  }),
  
  // User
  user: null,
  setUser: (user) => set({ user }),
  
  // Subscription Status
  subscriptionStatuses: {},
  setSubscriptionStatus: (conversationId, status) => set((state) => ({
    subscriptionStatuses: {
      ...state.subscriptionStatuses,
      [conversationId]: status
    }
  })),
  getSubscriptionStatus: (conversationId) => get().subscriptionStatuses[conversationId] || 'disconnected'
}))
