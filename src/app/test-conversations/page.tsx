'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TestConversationsPage() {
  const [getResults, setGetResults] = useState<any>(null)
  const [postResults, setPostResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      try {
        console.log('Fetching user...')
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.error('Auth error:', authError)
          setError(authError.message)
          return
        }

        console.log('User data:', user)
        if (!user) {
          console.log('No user found, redirecting...')
          router.push('/sign-in')
          return
        }

        setUser(user)
      } catch (error) {
        console.error('Error in getUser:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  const testGet = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/test-conversations')
      const data = await res.json()
      setGetResults(data)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch test results')
    }
    setLoading(false)
  }

  const testPost = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/test-conversations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      setPostResults(data)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to send test message')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-lg">Loading...</p>
        <p className="text-sm text-muted-foreground">Check browser console for details</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-lg text-red-500">Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-lg">Redirecting to login...</p>
        <Button onClick={() => router.push('/sign-in')}>Sign In</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Conversations</h1>

      <div className="space-y-8">
        {/* User Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Authenticated User</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(
              {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name,
              },
              null,
              2
            )}
          </pre>
        </Card>

        {/* Test GET */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test GET /api/test-conversations</h2>
          <Button onClick={testGet} disabled={loading} className="mb-4">
            Test GET
          </Button>
          {getResults && (
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(getResults, null, 2)}
            </pre>
          )}
        </Card>

        {/* Test POST */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test POST /api/test-conversations/send</h2>
          <Button onClick={testPost} disabled={loading} className="mb-4">
            Test Send Message
          </Button>
          {postResults && (
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(postResults, null, 2)}
            </pre>
          )}
        </Card>
      </div>
    </div>
  )
} 