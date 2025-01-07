'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AuthForm } from '@/components/auth/auth-form'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const supabase = createClient()
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleSubmit = async (data: any) => {
    try {
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/sign-in`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // If email confirmation is required
      if (signUpData?.user?.identities?.length === 0) {
        setError('This email is already registered. Please sign in instead.')
        return
      }

      setMessage('Please check your email for a confirmation link to complete your registration.')
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
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to create your account
          </p>
        </div>
        {message && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-600">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        <AuthForm type="signup" onSubmit={handleSubmit} />
        <p className="text-center text-sm text-muted-foreground">
          <Link 
            href="/sign-in"
            className="hover:text-brand underline underline-offset-4"
          >
            Already have an account? Sign in
          </Link>
        </p>
      </div>
    </main>
  )
} 