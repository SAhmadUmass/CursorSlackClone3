'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Icons } from '@/components/ui/icons'
import { sendPasswordResetEmail } from '@/lib/auth'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const handleSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      await sendPasswordResetEmail(data.email)
      setMessage('Check your email for a password reset link')
      form.reset()
    } catch (error) {
      console.error('Error sending reset email:', error)
      setError('Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
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
            Reset your password
          </h1>
          <p
            className={cn(
              'text-sm text-gray-500 dark:text-gray-400',
              'animate-in fade-in-50 duration-500 delay-200'
            )}
          >
            Enter your email address and we'll send you a link to reset your password
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
            {message}
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        type="email"
                        disabled={isLoading}
                        className={cn(
                          'w-full px-4 py-2 rounded-lg border',
                          'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                          'transition-all duration-200 ease-in-out',
                          'placeholder:text-gray-400',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500 mt-1" />
                  </FormItem>
                )}
              />
              <Button
                className={cn(
                  'w-full py-2.5',
                  'bg-blue-600 hover:bg-blue-700',
                  'text-white font-medium rounded-lg',
                  'transform transition-all duration-200 ease-in-out',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center space-x-2'
                )}
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Icons.spinner className="h-4 w-4 animate-spin" />}
                <span>Send reset link</span>
              </Button>
            </form>
          </Form>
        </div>

        <div className={cn('text-center', 'animate-in fade-in-50 duration-500 delay-500')}>
          <Link
            href="/sign-in"
            className={cn(
              'text-sm',
              'text-gray-500 dark:text-gray-400',
              'hover:text-gray-900 dark:hover:text-gray-100',
              'transition-colors duration-200',
              'underline underline-offset-4'
            )}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
