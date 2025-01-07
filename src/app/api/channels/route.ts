import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()

  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: channels, error } = await supabase
      .from('channels')
      .select(`
        *,
        messages:messages(count)
      `)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: channels.map((channel) => ({
        ...channel,
        messageCount: channel.messages[0]?.count || 0,
      })),
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
} 