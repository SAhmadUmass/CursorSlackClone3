'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AuthForm } from '@/components/auth/auth-form'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default function SignInPage() {
  const [supabase] = useState(() => createClient())
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
    <main
      className={cn(
        'min-h-screen w-full',
        'flex flex-col items-center justify-center',
        'bg-gray-50 dark:bg-gray-900',
        'p-4 sm:p-8'
      )}
    >
      <div
        className={cn(
          'w-full max-w-[400px]',
          'space-y-6',
          'animate-in fade-in-50 slide-in-from-bottom-16 duration-500'
        )}
      >
        <div className="flex flex-col space-y-2 text-center">
          <h1
            className={cn(
              'text-3xl font-bold tracking-tight',
              'text-gray-900 dark:text-gray-100',
              'animate-in fade-in-50 duration-500 delay-150'
            )}
          >
            Welcome back
          </h1>
          <p
            className={cn(
              'text-sm text-gray-500 dark:text-gray-400',
              'animate-in fade-in-50 duration-500 delay-200'
            )}
          >
            Enter your email to sign in to your account
          </p>
        </div>

        {message && (
          <div
            className={cn(
              'rounded-lg p-4',
              'bg-green-50 dark:bg-green-900/20',
              'text-sm text-green-600 dark:text-green-400',
              'border border-green-200 dark:border-green-800',
              'animate-in fade-in-50 duration-300'
            )}
          >
            {decodeURIComponent(message)}
          </div>
        )}

        {error && (
          <div
            className={cn(
              'rounded-lg p-4',
              'bg-red-50 dark:bg-red-900/20',
              'text-sm text-red-600 dark:text-red-400',
              'border border-red-200 dark:border-red-800',
              'animate-in fade-in-50 duration-300'
            )}
          >
            {error}
          </div>
        )}

        <div className="animate-in fade-in-50 duration-500 delay-300">
          <AuthForm type="signin" onSubmit={handleSubmit} />
        </div>

        <div
          className={cn(
            'flex flex-col space-y-3',
            'text-center text-sm',
            'animate-in fade-in-50 duration-500 delay-500'
          )}
        >
          <Link
            href="/forgot-password"
            className={cn(
              'text-gray-500 dark:text-gray-400',
              'hover:text-gray-900 dark:hover:text-gray-100',
              'transition-colors duration-200',
              'underline underline-offset-4'
            )}
          >
            Forgot your password?
          </Link>
          <Link
            href="/sign-up"
            className={cn(
              'text-gray-500 dark:text-gray-400',
              'hover:text-gray-900 dark:hover:text-gray-100',
              'transition-colors duration-200',
              'underline underline-offset-4'
            )}
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </main>
  )
}
