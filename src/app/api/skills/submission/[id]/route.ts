import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submissionId = params.id

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: submission, error } = await supabase
      .from('skill_submission_requests')
      .select('*')
      .eq('id', submissionId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching submission:', error)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ submission })
  } catch (error: any) {
    console.error('Error in GET /api/skills/submission/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
