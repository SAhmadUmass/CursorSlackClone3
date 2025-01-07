import { create } from 'zustand'
import { Channel, Message } from '@/types'

interface ChatStore {
  channels: Channel[]
  currentChannel: Channel | null
  messages: Message[]
  setChannels: (channels: Channel[]) => void
  setCurrentChannel: (channel: Channel) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (message: Message) => void
  deleteMessage: (messageId: string) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateMessage: (message) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === message.id ? message : msg
      ),
    })),
  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),
})) 