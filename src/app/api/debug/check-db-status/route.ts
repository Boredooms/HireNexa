import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get ALL recruiter applications
    const { data: recruiterApps, error: recruiterError } = await supabase
      .from('recruiter_applications')
      .select('*')
      .order('applied_at', { ascending: false })

    if (recruiterError) {
      return NextResponse.json({ error: recruiterError.message }, { status: 500 })
    }

    // Get ALL peer reviewer applications
    const { data: peerApps, error: peerError } = await supabase
      .from('peer_reviewer_applications')
      .select('*')
      .order('applied_at', { ascending: false })

    // Get ALL users
    const { data: users } = await supabase
      .from('users')
      .select('id, role, is_recruiter, is_admin')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      recruiterApplications: {
        total: recruiterApps?.length || 0,
        pending: recruiterApps?.filter(a => a.status === 'pending').length || 0,
        approved: recruiterApps?.filter(a => a.status === 'approved').length || 0,
        rejected: recruiterApps?.filter(a => a.status === 'rejected').length || 0,
        data: recruiterApps,
      },
      peerReviewerApplications: {
        total: peerApps?.length || 0,
        pending: peerApps?.filter(a => a.status === 'pending').length || 0,
        approved: peerApps?.filter(a => a.status === 'approved').length || 0,
        rejected: peerApps?.filter(a => a.status === 'rejected').length || 0,
        data: peerApps,
      },
      users: {
        total: users?.length || 0,
        admins: users?.filter(u => u.role === 'admin').length || 0,
        recruiters: users?.filter(u => u.role === 'recruiter').length || 0,
        students: users?.filter(u => u.role === 'student').length || 0,
        verifiers: users?.filter(u => u.role === 'verifier').length || 0,
        data: users,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
