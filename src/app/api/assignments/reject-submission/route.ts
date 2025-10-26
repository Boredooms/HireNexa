import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })
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

    // Get submission and verify ownership
    const { data: submission } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, assignments!inner(employer_id)')
      .eq('id', submissionId)
      .single()

    if (!submission || (submission.assignments as any)?.employer_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('assignment_submissions')
      .update({
        review_status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewer_id: userId,
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Error updating submission:', updateError)
      return NextResponse.json(
        { error: 'Failed to update submission: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Submission rejected',
    })
  } catch (error: any) {
    console.error('Error in POST /api/assignments/reject-submission:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
