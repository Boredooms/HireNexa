import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('id')

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get assignment details
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Get submissions count
    const { count: submissionsCount } = await supabase
      .from('assignment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('assignment_id', assignmentId)

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        status: assignment.status,
        blockchain_job_id: assignment.blockchain_job_id,
        blockchain_tx_hash: assignment.blockchain_tx_hash,
        blockchain_status: assignment.blockchain_status,
        reward_amount: assignment.reward_amount,
        max_submissions: assignment.max_submissions,
        current_submissions: assignment.current_submissions,
        created_at: assignment.created_at,
      },
      submissionsCount,
      diagnosis: {
        hasBlockchainId: !!assignment.blockchain_job_id,
        isActive: assignment.status === 'active',
        canAcceptSubmissions: assignment.current_submissions < assignment.max_submissions,
        blockchainStatus: assignment.blockchain_status,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
