import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get ALL recruiter applications (not just pending)
    console.log('🔍 Fetching recruiter applications...')
    const { data: allRecruiterApps, error: recruiterError } = await supabase
      .from('recruiter_applications')
      .select('*')
      .order('applied_at', { ascending: false })
    
    // Filter pending for display
    const recruiterApps = allRecruiterApps?.filter(app => app.status === 'pending') || []

    console.log('📊 Recruiter apps result:', { 
      count: recruiterApps?.length, 
      data: recruiterApps,
      error: recruiterError 
    })

    if (recruiterError) {
      console.error('❌ Recruiter apps error:', recruiterError)
    }

    // Get peer reviewer applications
    const { data: peerApps, error: peerError } = await supabase
      .from('peer_reviewer_applications')
      .select('*')
      .eq('status', 'pending')
      .order('applied_at', { ascending: false })

    if (peerError) {
      console.error('Peer apps error:', peerError)
    }

    // Calculate stats from allRecruiterApps
    const recruiterStats = {
      pending: allRecruiterApps?.filter(r => r.status === 'pending').length || 0,
      approved: allRecruiterApps?.filter(r => r.status === 'approved').length || 0,
      rejected: allRecruiterApps?.filter(r => r.status === 'rejected').length || 0,
    }

    // Get peer reviewer stats
    const { data: allPeerReviewers } = await supabase
      .from('peer_reviewer_applications')
      .select('status')

    const peerStats = {
      pending: allPeerReviewers?.filter(p => p.status === 'pending').length || 0,
      approved: allPeerReviewers?.filter(p => p.status === 'approved').length || 0,
      rejected: allPeerReviewers?.filter(p => p.status === 'rejected').length || 0,
    }

    return NextResponse.json({
      recruiterApplications: recruiterApps || [],
      peerReviewerApplications: peerApps || [],
      stats: {
        recruiters: recruiterStats,
        peerReviewers: peerStats,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/get-applications:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
