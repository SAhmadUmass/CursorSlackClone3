import { Message } from '@/types'

// LRU Cache implementation
class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, V>
  private keyOrder: K[]

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
    this.keyOrder = []
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined

    // Move to most recently used
    this.keyOrder = this.keyOrder.filter(k => k !== key)
    this.keyOrder.push(key)
    
    return this.cache.get(key)
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing entry
      this.cache.set(key, value)
      this.keyOrder = this.keyOrder.filter(k => k !== key)
      this.keyOrder.push(key)
    } else {
      // Add new entry
      if (this.keyOrder.length >= this.capacity) {
        // Remove least recently used
        const lru = this.keyOrder.shift()
        if (lru) this.cache.delete(lru)
      }
      this.cache.set(key, value)
      this.keyOrder.push(key)
    }
  }

  delete(key: K): void {
    this.cache.delete(key)
    this.keyOrder = this.keyOrder.filter(k => k !== key)
  }

  clear(): void {
    this.cache.clear()
    this.keyOrder = []
  }
}

// Message Cache Manager
class MessageCacheManager {
  private static instance: MessageCacheManager
  private messageCache: LRUCache<string, Message[]>
  private processedIds: LRUCache<string, Set<string>>
  private static readonly CACHE_SIZE = 50 // Number of conversations to cache
  private static readonly MAX_MESSAGES_PER_CONVERSATION = 100

  private constructor() {
    this.messageCache = new LRUCache<string, Message[]>(MessageCacheManager.CACHE_SIZE)
    this.processedIds = new LRUCache<string, Set<string>>(MessageCacheManager.CACHE_SIZE)
  }

  static getInstance(): MessageCacheManager {
    if (!MessageCacheManager.instance) {
      MessageCacheManager.instance = new MessageCacheManager()
    }
    return MessageCacheManager.instance
  }

  getMessages(conversationId: string): Message[] {
    return this.messageCache.get(conversationId) || []
  }

  setMessages(conversationId: string, messages: Message[]): void {
    // Keep only the most recent messages
    const recentMessages = messages
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, MessageCacheManager.MAX_MESSAGES_PER_CONVERSATION)
    
    this.messageCache.set(conversationId, recentMessages)
  }

  addMessage(conversationId: string, message: Message): void {
    const messages = this.getMessages(conversationId)
    const processedIds = this.getProcessedIds(conversationId)

    // Check if message is already processed
    if (processedIds.has(message.client_generated_id)) return

    // Add to processed IDs
    processedIds.add(message.client_generated_id)
    this.processedIds.set(conversationId, processedIds)

    // Add message to cache
    const updatedMessages = [message, ...messages]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, MessageCacheManager.MAX_MESSAGES_PER_CONVERSATION)

    this.messageCache.set(conversationId, updatedMessages)
  }

  updateMessage(conversationId: string, message: Message): void {
    const messages = this.getMessages(conversationId)
    const updatedMessages = messages.map(msg => 
      msg.id === message.id ? message : msg
    )
    this.messageCache.set(conversationId, updatedMessages)
  }

  deleteMessage(conversationId: string, messageId: string): void {
    const messages = this.getMessages(conversationId)
    const updatedMessages = messages.filter(msg => msg.id !== messageId)
    this.messageCache.set(conversationId, updatedMessages)
  }

  private getProcessedIds(conversationId: string): Set<string> {
    return this.processedIds.get(conversationId) || new Set()
  }

  clearConversation(conversationId: string): void {
    this.messageCache.delete(conversationId)
    this.processedIds.delete(conversationId)
  }

  clearAll(): void {
    this.messageCache.clear()
    this.processedIds.clear()
  }
}

export const messageCache = MessageCacheManager.getInstance() 