'use client'

import * as React from 'react'
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

interface AuthFormProps {
  type: 'signin' | 'signup'
  onSubmit: (data: AuthFormValues) => Promise<void>
  className?: string
}

const authFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  fullName: z.string().optional(),
})

export type AuthFormValues = z.infer<typeof authFormSchema>

export function AuthForm({ type, onSubmit, className }: AuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
  })

  const handleSubmit = async (data: AuthFormValues) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'w-full max-w-md mx-auto p-6 space-y-6',
        'bg-white dark:bg-gray-900 rounded-xl shadow-lg',
        'transform transition-all duration-300 ease-in-out',
        'hover:shadow-xl',
        'border border-gray-200 dark:border-gray-800',
        className
      )}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {type === 'signup' && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
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
          )}
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your password"
                    type="password"
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
            <span>{type === 'signin' ? 'Sign In' : 'Sign Up'}</span>
          </Button>
        </form>
      </Form>
    </div>
  )
}
