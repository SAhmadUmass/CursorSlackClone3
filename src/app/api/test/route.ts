import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/config'
import { ConversationType } from '@/types'

// Add interface for the expected conversation type
interface Conversation {
  name: string
  type: ConversationType
  messages: { count: number }[]
}

export async function GET() {
  try {
    const { data: rawData, error } = await supabase
      .from('conversations')
      .select(
        `
        name,
        type,
        messages:messages(count)
      `
      )
      .eq('type', 'channel') // Only get channels for backward compatibility

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    if (!rawData) {
      return NextResponse.json({
        success: false,
        error: 'No data found'
      }, { status: 404 })
    }

    // Explicitly cast the data as Conversation[]
    const data = rawData as Conversation[]

    return NextResponse.json({
      success: true,
      data: data.map((conversation) => ({
        name: conversation.name,
        messageCount: conversation.messages[0]?.count || 0,
      })),
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch channels' 
    }, { status: 500 })
  }
}
