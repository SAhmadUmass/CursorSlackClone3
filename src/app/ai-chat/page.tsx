import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AIChatWindow } from '@/components/chat/ai-chat/AIChatWindow'

export default async function AIChatPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/sign-in')
  }

  return (
    <main className="flex-1 flex flex-col">
      <AIChatWindow />
    </main>
  )
} 