import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId, assignmentId, candidateId, txHash, certificateTokenId, certificateTxHash } = await request.json()

    if (!submissionId || !assignmentId || !candidateId || !txHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify user owns this assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .select('employer_id, reward_amount')
      .eq('id', assignmentId)
      .single()

    if (!assignment || assignment.employer_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('assignment_submissions')
      .update({
        review_status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewer_id: userId,
        is_winner: true,
        reward_paid: true,
        reward_tx_hash: txHash,
        certificate_minted: true,
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Error updating submission:', updateError)
      return NextResponse.json(
        { error: 'Failed to update submission: ' + updateError.message },
        { status: 500 }
      )
    }

    // Create certificate record
    const { error: certError } = await supabase
      .from('certificates')
      .insert({
        user_id: candidateId,
        certificate_type: 'assignment_completion',
        title: `Assignment Completed`,
        issuer_id: userId,
        issuer_name: 'Hirenexa',
        related_assignment_id: assignmentId,
        related_submission_id: submissionId,
        blockchain_tx_hash: certificateTxHash || txHash,
        nft_token_id: certificateTokenId,
        issued_at: new Date().toISOString(),
      })

    if (certError) {
      console.error('Error creating certificate:', certError)
      // Don't fail the request, just log the error
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        payer_id: userId,
        payee_id: candidateId,
        amount: assignment.reward_amount * 0.98, // After 2% platform fee
        currency: 'CELO',
        payment_type: 'assignment_reward',
        related_assignment_id: assignmentId,
        blockchain_tx_hash: txHash,
        blockchain_status: 'confirmed',
        status: 'completed',
        completed_at: new Date().toISOString(),
      })

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      // Don't fail the request, just log the error
    }

    // Mark assignment as completed
    const { error: assignmentUpdateError } = await supabase
      .from('assignments')
      .update({
        status: 'closed',
      })
      .eq('id', assignmentId)

    if (assignmentUpdateError) {
      console.error('Error updating assignment status:', assignmentUpdateError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Submission approved successfully',
    })
  } catch (error: any) {
    console.error('Error in POST /api/assignments/approve-submission:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
