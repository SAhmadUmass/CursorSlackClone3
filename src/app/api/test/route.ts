import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/config'

// Add interface for the expected channel type
interface Channel {
  name: string
  messages: { count: number }[]
}

export async function GET() {
  try {
    const { data: rawData, error } = await supabase
      .from('channels')
      .select(
        `
        name,
        messages:messages(count)
      `
      )

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

    // Explicitly cast the data as Channel[]
    const data = rawData as Channel[]

    return NextResponse.json({
      success: true,
      data: data.map((channel) => ({
        name: channel.name,
        messageCount: channel.messages[0]?.count || 0,
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
