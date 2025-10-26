import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Get skills awaiting review (paid but not assigned)
    const { data: skills, error } = await supabase
      .from('skill_submission_requests')
      .select(`
        *,
        users:user_id (
          full_name,
          email,
          github_username
        )
      `)
      .eq('status', 'awaiting_review')
      .is('assigned_reviewer_id', null)
      .order('paid_at', { ascending: true })
      .limit(20)

    if (error) {
      console.error('Error fetching skills:', error)
      return NextResponse.json(
        { error: 'Failed to fetch skills' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      skills: skills || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/skills/available-for-review:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
