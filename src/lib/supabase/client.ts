import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: { path: string; maxAge?: number }) {
          let cookie = `${name}=${value}; path=${options.path}`
          if (options.maxAge) {
            cookie += `; max-age=${options.maxAge}`
          }
          document.cookie = cookie
        },
        remove(name: string, options: { path: string }) {
          document.cookie = `${name}=; path=${options.path}; max-age=0`
        },
      },
    }
  )
