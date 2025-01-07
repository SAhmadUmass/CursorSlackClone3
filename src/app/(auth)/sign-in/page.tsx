'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { AuthForm } from '@/components/auth/auth-form'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const supabase = createClient()
  const [error, setError] = useState<string>('')
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  const handleSubmit = async (data: any) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      window.location.href = '/'
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error(err)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-[350px] space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to sign in to your account
          </p>
        </div>
        
        {message && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-600">
            {decodeURIComponent(message)}
          </div>
        )}
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        
        <AuthForm type="signin" onSubmit={handleSubmit} />
        
        <div className="flex flex-col space-y-2 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-brand underline underline-offset-4"
          >
            Forgot your password?
          </Link>
          <Link 
            href="/sign-up"
            className="text-muted-foreground hover:text-brand underline underline-offset-4"
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </main>
  )
} 