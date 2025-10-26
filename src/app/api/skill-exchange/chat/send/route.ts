import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { match_id, message } = body

    // Get sender name
    const { data: profile } = await supabase
      .from('skill_exchange_profiles')
      .select('name')
      .eq('user_id', userId)
      .single()

    // Insert message - Supabase Realtime will broadcast this automatically
    const { data, error } = await supabase
      .from('skill_exchange_messages')
      .insert({
        match_id,
        sender_id: userId,
        sender_name: profile?.name || 'Unknown',
        message,
        type: 'text',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, message: data })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
