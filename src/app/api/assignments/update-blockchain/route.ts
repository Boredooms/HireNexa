import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId, blockchainAssignmentId, blockchainTxHash } = await req.json()

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update assignment with blockchain info
    const { error } = await supabase
      .from('assignments')
      .update({
        blockchain_job_id: blockchainAssignmentId,
        blockchain_tx_hash: blockchainTxHash,
      })
      .eq('id', assignmentId)
      .eq('employer_id', userId) // Ensure user owns this assignment

    if (error) {
      console.error('Error updating assignment:', error)
      return NextResponse.json(
        { error: 'Failed to update assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in POST /api/assignments/update-blockchain:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
