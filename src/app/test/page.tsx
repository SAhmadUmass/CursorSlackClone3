'use client'

import { useEffect, useState } from 'react'

interface ChannelData {
  name: string
  messageCount: number
}

export default function TestPage() {
  const [channels, setChannels] = useState<ChannelData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchChannels() {
      try {
        const response = await fetch('/api/test')
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error)
        }

        setChannels(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch channels')
      } finally {
        setLoading(false)
      }
    }

    fetchChannels()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-8 text-2xl font-bold">Supabase Connection Test</h1>
      <div className="w-full max-w-md space-y-4">
        {channels.map((channel) => (
          <div
            key={channel.name}
            className="rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <h2 className="text-xl font-semibold">{channel.name}</h2>
            <p className="text-gray-600">Messages: {channel.messageCount}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 