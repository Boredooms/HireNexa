import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: match, error } = await supabase
      .from('skill_exchange_profiles')
      .select('*')
      .eq('id', params.matchId)
      .single()

    if (error) throw error

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}
