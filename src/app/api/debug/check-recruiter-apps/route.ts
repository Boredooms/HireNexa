import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all recruiter applications
    const { data: allRecruiters, error: recruitersError } = await supabase
      .from('recruiter_applications')
      .select('*')
      .order('applied_at', { ascending: false })

    if (recruitersError) {
      return NextResponse.json({
        error: 'Failed to fetch recruiter applications',
        details: recruitersError.message,
      }, { status: 500 })
    }

    // Get pending recruiter applications
    const { data: pendingRecruiters, error: pendingError } = await supabase
      .from('recruiter_applications')
      .select('*')
      .eq('status', 'pending')
      .order('applied_at', { ascending: false })

    if (pendingError) {
      return NextResponse.json({
        error: 'Failed to fetch pending applications',
        details: pendingError.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      totalRecruiters: allRecruiters?.length || 0,
      pendingRecruiters: pendingRecruiters?.length || 0,
      allApplications: allRecruiters || [],
      pendingApplications: pendingRecruiters || [],
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 })
  }
}
