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
  addChannel: (channel: Channel) => void
  updateChannel: (channel: Channel) => void
  deleteChannel: (channelId: string) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      // Check if message with same client_generated_id already exists
      const existingIndex = state.messages.findIndex(
        (m) => m.client_generated_id === message.client_generated_id
      )

      if (existingIndex !== -1) {
        // Update existing message
        const updatedMessages = [...state.messages]
        updatedMessages[existingIndex] = message
        return { messages: updatedMessages }
      }

      // Add new message
      return { messages: [...state.messages, message] }
    }),
  updateMessage: (message) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.client_generated_id === message.client_generated_id ? message : msg
      ),
    })),
  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),
  addChannel: (channel) =>
    set((state) => ({
      channels: [...state.channels, channel],
    })),
  updateChannel: (channel) =>
    set((state) => ({
      channels: state.channels.map((ch) => (ch.id === channel.id ? channel : ch)),
      currentChannel: state.currentChannel?.id === channel.id ? channel : state.currentChannel,
    })),
  deleteChannel: (channelId) =>
    set((state) => ({
      channels: state.channels.filter((ch) => ch.id !== channelId),
      currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
      messages: state.messages.filter((msg) => msg.channel_id !== channelId),
    })),
}))
