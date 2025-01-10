import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/config'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select(
        `
        name,
        messages:messages(count)
      `
      )
      .returns<{ name: string; messages: { count: number }[] }>()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data.map((channel) => ({
        name: channel.name,
        messageCount: channel.messages[0]?.count || 0,
      })),
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch channels' }, { status: 500 })
  }
}
