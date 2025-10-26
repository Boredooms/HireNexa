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

    // Check all related records
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('id, candidate_id, review_status')
      .eq('assignment_id', assignmentId)

    const { data: certificates } = await supabase
      .from('certificates')
      .select('id, user_id')
      .eq('related_assignment_id', assignmentId)

    const { data: payments } = await supabase
      .from('payments')
      .select('id, payer_id, payee_id, amount')
      .eq('related_assignment_id', assignmentId)

    const { data: applications } = await supabase
      .from('applications')
      .select('id, candidate_id, status')
      .eq('assignment_id', assignmentId)

    return NextResponse.json({
      assignmentId,
      relatedRecords: {
        submissions: submissions?.length || 0,
        certificates: certificates?.length || 0,
        payments: payments?.length || 0,
        applications: applications?.length || 0,
      },
      details: {
        submissions,
        certificates,
        payments,
        applications,
      },
      canDelete: true, // We'll delete related records first
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
