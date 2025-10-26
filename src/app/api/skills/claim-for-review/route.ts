import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionId } = await req.json()

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user is an approved peer reviewer
    const { data: reviewerApp } = await supabase
      .from('peer_reviewer_applications')
      .select('status')
      .eq('user_id', userId)
      .single()

    if (!reviewerApp || reviewerApp.status !== 'approved') {
      return NextResponse.json(
        { error: 'You must be an approved peer reviewer' },
        { status: 403 }
      )
    }

    // Check if skill is still available
    const { data: submission } = await supabase
      .from('skill_submission_requests')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (!submission) {
      return NextResponse.json(
        { error: 'Skill submission not found' },
        { status: 404 }
      )
    }

    if (submission.assigned_reviewer_id) {
      return NextResponse.json(
        { error: 'This skill has already been claimed by another reviewer' },
        { status: 409 }
      )
    }

    if (submission.status !== 'awaiting_review') {
      return NextResponse.json(
        { error: 'This skill is not available for review' },
        { status: 400 }
      )
    }

    // Assign to reviewer
    const { data: updated, error: updateError } = await supabase
      .from('skill_submission_requests')
      .update({
        assigned_reviewer_id: userId,
        status: 'under_review',
        assigned_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .is('assigned_reviewer_id', null) // Prevent race condition
      .select()
      .single()

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Failed to claim skill. It may have been claimed by another reviewer.' },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Skill claimed successfully',
      submission: updated,
    })
  } catch (error: any) {
    console.error('Error in POST /api/skills/claim-for-review:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
