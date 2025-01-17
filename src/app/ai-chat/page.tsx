import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AIChatWindow } from '@/components/chat/ai-chat/AIChatWindow'
import { Message } from '@/types'

// Use the same UUID as in AIChatWindow
const AI_CHAT_CONVERSATION_ID = 'c0f45d1a-e3b0-4939-a90f-6b1061ccb49e'

export default async function AIChatPage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Use getUser() instead of getSession() for better security
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/sign-in')
  }

  // Create AI conversation if it doesn't exist
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', AI_CHAT_CONVERSATION_ID)
    .single()

  if (!existingConversation) {
    await supabase
      .from('conversations')
      .insert({
        id: AI_CHAT_CONVERSATION_ID,
        type: 'ai',
        name: 'AI Assistant',
        created_by: user.id,
      })
  }

  // Load previous AI chat messages
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      user_id,
      client_generated_id,
      conversation_type,
      conversation_id,
      sources,
      user:users!user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('conversation_type', 'ai')
    .eq('conversation_id', AI_CHAT_CONVERSATION_ID)
    .order('created_at', { ascending: true })
    .returns<Message[]>()

  return (
    <main className="flex-1 flex flex-col">
      <AIChatWindow initialMessages={messages || []} />
    </main>
  )
} 