import { SupabaseClient } from '@supabase/supabase-js'

type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface SubscriptionState {
  status: SubscriptionStatus
  lastConnected: Date | null
  retryCount: number
  channel: ReturnType<SupabaseClient['channel']> | null
}

class SubscriptionManager {
  private static instance: SubscriptionManager
  private subscriptions: Map<string, SubscriptionState>
  private static readonly MAX_RETRY_COUNT = 5
  private static readonly INITIAL_RETRY_DELAY = 1000 // 1 second
  private static readonly MAX_RETRY_DELAY = 30000 // 30 seconds

  private constructor() {
    this.subscriptions = new Map()
  }

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager()
    }
    return SubscriptionManager.instance
  }

  getSubscriptionState(subscriptionId: string): SubscriptionState | undefined {
    return this.subscriptions.get(subscriptionId)
  }

  registerSubscription(
    subscriptionId: string,
    channel: ReturnType<SupabaseClient['channel']>
  ): void {
    this.subscriptions.set(subscriptionId, {
      status: 'connecting',
      lastConnected: null,
      retryCount: 0,
      channel,
    })
  }

  updateStatus(subscriptionId: string, status: SubscriptionStatus): void {
    const state = this.subscriptions.get(subscriptionId)
    if (!state) return

    this.subscriptions.set(subscriptionId, {
      ...state,
      status,
      lastConnected: status === 'connected' ? new Date() : state.lastConnected,
      retryCount: status === 'connected' ? 0 : state.retryCount,
    })
  }

  async handleDisconnect(
    subscriptionId: string,
    supabase: SupabaseClient,
    setupChannel: () => ReturnType<SupabaseClient['channel']>
  ): Promise<void> {
    const state = this.subscriptions.get(subscriptionId)
    if (!state) return

    // Update status
    this.updateStatus(subscriptionId, 'disconnected')

    // Check if we should retry
    if (state.retryCount >= SubscriptionManager.MAX_RETRY_COUNT) {
      this.updateStatus(subscriptionId, 'error')
      return
    }

    // Calculate retry delay with exponential backoff
    const delay = Math.min(
      SubscriptionManager.INITIAL_RETRY_DELAY * Math.pow(2, state.retryCount),
      SubscriptionManager.MAX_RETRY_DELAY
    )

    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, delay))

    // Remove old channel
    if (state.channel) {
      await supabase.removeChannel(state.channel)
    }

    // Create new channel
    const newChannel = setupChannel()

    // Update state
    this.subscriptions.set(subscriptionId, {
      ...state,
      status: 'connecting',
      retryCount: state.retryCount + 1,
      channel: newChannel,
    })
  }

  removeSubscription(subscriptionId: string, supabase: SupabaseClient): void {
    const state = this.subscriptions.get(subscriptionId)
    if (state?.channel) {
      supabase.removeChannel(state.channel)
    }
    this.subscriptions.delete(subscriptionId)
  }

  clearAll(supabase: SupabaseClient): void {
    // Convert Map entries to array before iteration
    Array.from(this.subscriptions.entries()).forEach(([subscriptionId]) => {
      this.removeSubscription(subscriptionId, supabase)
    })
  }
}

export const subscriptionManager = SubscriptionManager.getInstance() 