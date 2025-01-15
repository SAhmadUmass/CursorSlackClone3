import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return ''
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; secure?: boolean }) {
          if (typeof document === 'undefined') return
          let cookie = `${name}=${value}`
          if (options?.path) cookie += `; path=${options.path}`
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
          if (options?.domain) cookie += `; domain=${options.domain}`
          if (options?.secure) cookie += `; secure`
          document.cookie = cookie
        },
        remove(name: string, options: { path?: string }) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${
            options?.path ? `; path=${options.path}` : ''
          }`
        },
      },
      db: {
        schema: 'public',
      },
    }
  )
