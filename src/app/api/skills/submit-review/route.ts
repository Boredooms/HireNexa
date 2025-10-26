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
    const {
      submissionId,
      verified,
      confidence_score,
      proficiency_assessment,
      review_notes,
      strengths,
      areas_for_improvement,
      evidence_quality_score,
    } = body

    // Validate required fields
    if (!submissionId || verified === undefined || !confidence_score || !review_notes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (review_notes.length < 50) {
      return NextResponse.json(
        { error: 'Review notes must be at least 50 characters' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user is assigned to this submission
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

    if (submission.assigned_reviewer_id !== userId) {
      return NextResponse.json(
        { error: 'You are not assigned to review this skill' },
        { status: 403 }
      )
    }

    if (submission.status !== 'under_review') {
      return NextResponse.json(
        { error: 'This skill is not under review' },
        { status: 400 }
      )
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('skill_verification_reviews')
      .insert({
        submission_id: submissionId,
        reviewer_id: userId,
        verified,
        confidence_score,
        proficiency_assessment,
        review_notes,
        strengths: strengths || null,
        areas_for_improvement: areas_for_improvement || null,
        evidence_quality_score: evidence_quality_score || null,
        status: 'submitted',
        reward_amount: 5, // 5 cUSD
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Error creating review:', reviewError)
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      )
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('skill_submission_requests')
      .update({
        status: verified ? 'verified' : 'rejected',
        completed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Error updating submission:', updateError)
    }

    // Create earning record for reviewer
    const { error: earningError } = await supabase
      .from('reviewer_earnings')
      .insert({
        reviewer_id: userId,
        review_id: review.id,
        amount: 5,
        currency: 'cUSD',
        status: 'pending', // Will be paid via blockchain
      })

    if (earningError) {
      console.error('Error creating earning record:', earningError)
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully. Payment will be processed on the blockchain.',
      review,
    })
  } catch (error: any) {
    console.error('Error in POST /api/skills/submit-review:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
