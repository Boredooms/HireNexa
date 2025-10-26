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
    const body = await request.json()
    const { blockchain_tx_hash } = body

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
      return NextResponse.json({ error: 'Only recipient can accept' }, { status: 403 })
    }

    // Check if already accepted
    if (barter.status !== 'pending') {
      return NextResponse.json({ error: 'Barter already processed' }, { status: 400 })
    }

    // Update barter status
    const { data: updatedBarter, error: updateError } = await supabase
      .from('skill_barter_proposals')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        acceptance_tx_hash: blockchain_tx_hash
      })
      .eq('id', barterId)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error(`Failed to update barter status: ${updateError.message}`)
    }

    // Send notification to proposer
    await supabase
      .from('notifications')
      .insert({
        user_id: barter.proposer_id,
        type: 'barter_accepted',
        title: 'Barter Accepted! 🎉',
        message: `Your barter proposal has been accepted!`,
        data: { barter_id: barterId },
        read: false,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true,
      message: 'Barter accepted successfully'
    })
  } catch (error) {
    console.error('Error accepting barter:', error)
    return NextResponse.json({ error: 'Failed to accept barter' }, { status: 500 })
  }
}
