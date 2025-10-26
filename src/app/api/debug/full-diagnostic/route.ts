import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    // Get my recruiter application
    const { data: myApp } = await supabase
      .from('recruiter_applications')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get all recruiter applications
    const { data: allRecruiterApps } = await supabase
      .from('recruiter_applications')
      .select('*')
      .order('applied_at', { ascending: false })

    // Get all peer reviewer applications
    const { data: allPeerApps } = await supabase
      .from('peer_reviewer_applications')
      .select('*')
      .order('applied_at', { ascending: false })

    // Test API endpoint
    let apiStatus: any = { getApplications: false, getApplicationsError: null }
    try {
      const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/get-applications`, {
        headers: {
          'Cookie': req.headers.get('cookie') || ''
        }
      })
      apiStatus.getApplications = apiResponse.ok
      if (!apiResponse.ok) {
        apiStatus.getApplicationsError = `HTTP ${apiResponse.status}`
      }
    } catch (err: any) {
      apiStatus.getApplicationsError = err.message
    }

    return NextResponse.json({
      userId,
      userRole: user?.role,
      isAdmin: user?.role === 'admin',
      canAccessAdmin: user?.role === 'admin',
      myApplication: myApp,
      recruiterAppsCount: allRecruiterApps?.length || 0,
      peerAppsCount: allPeerApps?.length || 0,
      allRecruiterApplications: allRecruiterApps,
      allPeerApplications: allPeerApps,
      apiStatus,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 })
  }
}
