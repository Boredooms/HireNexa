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
      company_name,
      company_website,
      company_description,
      years_hiring_experience,
      linkedin_profile,
      why_join_platform,
      expected_monthly_postings,
    } = body

    // Validate required fields
    if (!company_name || !company_description || !why_join_platform) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (why_join_platform.length < 50) {
      return NextResponse.json(
        { error: 'Why join platform must be at least 50 characters' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user already has an application
    const { data: existingApp } = await supabase
      .from('recruiter_applications')
      .select('id, status')
      .eq('user_id', userId)
      .single()

    if (existingApp) {
      if (existingApp.status === 'pending' || existingApp.status === 'reviewing') {
        return NextResponse.json(
          { error: 'You already have a pending application' },
          { status: 400 }
        )
      }
      if (existingApp.status === 'approved') {
        return NextResponse.json(
          { error: 'You are already an approved recruiter' },
          { status: 400 }
        )
      }
    }

    // Create application
    const { data: application, error: insertError } = await supabase
      .from('recruiter_applications')
      .insert({
        user_id: userId,
        company_name,
        company_website: company_website || null,
        company_description,
        years_hiring_experience: years_hiring_experience ? parseInt(years_hiring_experience) : null,
        linkedin_profile: linkedin_profile || null,
        why_join_platform,
        expected_monthly_postings: expected_monthly_postings ? parseInt(expected_monthly_postings) : null,
        status: 'pending',
        applied_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating application:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    // Create admin action log
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: 'system',
        action_type: 'assignment_approve',
        target_type: 'user',
        target_id: userId,
        reason: `New recruiter application from ${company_name}`,
        metadata: {
          application_id: application.id,
          company_name,
          years_experience: years_hiring_experience,
        },
      })

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application,
    })
  } catch (error: any) {
    console.error('Error in POST /api/recruiter/apply:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
