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
      expertise_areas,
      years_experience,
      github_profile,
      linkedin_profile,
      portfolio_url,
      why_verify_skills,
      previous_verification_experience,
    } = body

    console.log('📝 Peer reviewer apply request:', { expertise_areas, years_experience, why_verify_skills })

    // Validate required fields
    if (!expertise_areas || expertise_areas.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one expertise area' },
        { status: 400 }
      )
    }

    if (!years_experience || !why_verify_skills) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (why_verify_skills.length < 50) {
      return NextResponse.json(
        { error: 'Why verify skills must be at least 50 characters' },
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
      .from('peer_reviewer_applications')
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
          { error: 'You are already an approved peer reviewer' },
          { status: 400 }
        )
      }
    }

    // Create application
    console.log('🔍 Inserting peer reviewer application...')
    const { data: application, error: insertError } = await supabase
      .from('peer_reviewer_applications')
      .insert({
        user_id: userId,
        expertise_areas,
        years_experience: parseInt(years_experience),
        github_profile: github_profile || null,
        linkedin_profile: linkedin_profile || null,
        portfolio_url: portfolio_url || null,
        why_verify_skills,
        previous_verification_experience: previous_verification_experience || null,
        status: 'pending',
        applied_at: new Date().toISOString(),
      })
      .select()
      .single()

    console.log('✅ Insert result:', { application, insertError })

    if (insertError) {
      console.error('❌ Error creating application:', insertError)
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
        reason: `New peer reviewer application`,
        metadata: {
          application_id: application.id,
          expertise_areas,
          years_experience,
        },
      })

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application,
    })
  } catch (error: any) {
    console.error('Error in POST /api/peer-reviewer/apply:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
