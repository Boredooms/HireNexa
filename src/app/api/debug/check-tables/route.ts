import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Try to query recruiter_applications table
    const { data: recruiterApps, error: recruiterError } = await supabase
      .from('recruiter_applications')
      .select('*')
      .limit(1)

    // Try to query peer_reviewer_applications table
    const { data: peerApps, error: peerError } = await supabase
      .from('peer_reviewer_applications')
      .select('*')
      .limit(1)

    return NextResponse.json({
      tables: {
        recruiter_applications: {
          exists: !recruiterError,
          error: recruiterError?.message || null,
          sampleData: recruiterApps,
        },
        peer_reviewer_applications: {
          exists: !peerError,
          error: peerError?.message || null,
          sampleData: peerApps,
        },
      },
      message: recruiterError || peerError 
        ? '❌ Tables do not exist! Run the migration in Supabase.'
        : '✅ Tables exist!',
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 })
  }
}
