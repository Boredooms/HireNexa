import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { submissionId, txHash } = body

    if (!submissionId || !txHash) {
      return NextResponse.json(
        { error: 'Missing submissionId or txHash' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update the submission
    const { data, error } = await supabase
      .from('skill_submission_requests')
      .update({
        payment_status: 'paid',
        payment_tx_hash: txHash,
        paid_at: new Date().toISOString(),
        status: 'awaiting_review',
      })
      .eq('id', submissionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment status:', error)
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      submission: data,
    })
  } catch (error: any) {
    console.error('Error in POST /api/skills/update-payment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
