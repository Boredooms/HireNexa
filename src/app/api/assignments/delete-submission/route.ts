import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const submissionId = searchParams.get('id')

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get submission with assignment info
    const { data: submission } = await supabase
      .from('assignment_submissions')
      .select('candidate_id, blockchain_submission_id, assignment_id, assignments(employer_id)')
      .eq('id', submissionId)
      .single()

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Allow deletion if user is either the candidate OR the assignment recruiter
    const isCandidate = submission.candidate_id === userId
    const isRecruiter = (submission.assignments as any)?.employer_id === userId
    
    if (!isCandidate && !isRecruiter) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Only allow deletion if blockchain submission failed (no blockchain_submission_id)
    if (submission.blockchain_submission_id) {
      return NextResponse.json(
        { error: 'Cannot delete submission that was recorded on blockchain' },
        { status: 400 }
      )
    }

    // Delete the submission
    const { error: deleteError } = await supabase
      .from('assignment_submissions')
      .delete()
      .eq('id', submissionId)

    if (deleteError) {
      console.error('Error deleting submission:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete submission: ' + deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Failed submission deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/assignments/delete-submission:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
