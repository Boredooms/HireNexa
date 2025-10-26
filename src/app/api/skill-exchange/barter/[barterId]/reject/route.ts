import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { barterId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { barterId } = params

    // Get barter
    const { data: barter, error: fetchError } = await supabase
      .from('skill_barter_proposals')
      .select('*')
      .eq('id', barterId)
      .single()

    if (fetchError) throw fetchError

    if (!barter) {
      return NextResponse.json({ error: 'Barter not found' }, { status: 404 })
    }

    // Check if user is the recipient
    if (barter.recipient_id !== userId) {
      return NextResponse.json({ error: 'Only recipient can reject' }, { status: 403 })
    }

    // Check if already processed
    if (barter.status !== 'pending') {
      return NextResponse.json({ error: 'Barter already processed' }, { status: 400 })
    }

    // Update barter status
    const { error: updateError } = await supabase
      .from('skill_barter_proposals')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString()
      })
      .eq('id', barterId)

    if (updateError) throw updateError

    // Send notification to proposer
    await supabase
      .from('notifications')
      .insert({
        user_id: barter.proposer_id,
        type: 'barter_rejected',
        title: 'Barter Rejected',
        message: `Your barter proposal was rejected`,
        data: { barter_id: barterId },
        read: false,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true,
      message: 'Barter rejected'
    })
  } catch (error) {
    console.error('Error rejecting barter:', error)
    return NextResponse.json({ error: 'Failed to reject barter' }, { status: 500 })
  }
}
