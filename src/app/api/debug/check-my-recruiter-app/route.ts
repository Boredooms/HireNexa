import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get my application
    const { data: myApp, error: myAppError } = await supabase
      .from('recruiter_applications')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get all applications (for debugging)
    const { data: allApps, error: allAppsError } = await supabase
      .from('recruiter_applications')
      .select('*')
      .order('applied_at', { ascending: false })

    return NextResponse.json({
      found: !!myApp && !myAppError,
      application: myApp || null,
      error: myAppError?.message || null,
      allApplications: allApps || [],
      userId,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 })
  }
}
