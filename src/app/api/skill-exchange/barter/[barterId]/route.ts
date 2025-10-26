import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { barterId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { barterId } = params

    // Get barter details
    const { data: barter, error } = await supabase
      .from('skill_barter_proposals')
      .select('*')
      .eq('id', barterId)
      .single()

    if (error) throw error

    if (!barter) {
      return NextResponse.json({ error: 'Barter not found' }, { status: 404 })
    }

    // Check if user is involved in this barter
    if (barter.proposer_id !== userId && barter.recipient_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ barter })
  } catch (error) {
    console.error('Error fetching barter:', error)
    return NextResponse.json({ error: 'Failed to fetch barter' }, { status: 500 })
  }
}
