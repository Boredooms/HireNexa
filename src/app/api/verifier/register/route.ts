import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/verifier/register
 * Register as a skill verifier
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Check if already registered
    const { data: existing } = await supabase
      .from('verifier_reputation')
      .select('*')
      .eq('verifier_id', userId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Already registered as verifier' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { expertise_areas, years_experience, github_profile, linkedin_profile, why_verify } =
      body

    // Create verifier reputation entry
    const { data: verifier, error: verifierError } = await supabase
      .from('verifier_reputation')
      .insert({
        verifier_id: userId,
        overall_score: 50, // Start with neutral score
        accuracy_score: 50,
        response_time_score: 50,
        thoroughness_score: 50,
        total_verifications: 0,
        successful_verifications: 0,
        disputed_verifications: 0,
        average_verification_time: 0,
        total_earned_cusd: 0,
        is_authorized: false, // Requires admin approval
        is_suspended: false,
      })
      .select()
      .single()

    if (verifierError) {
      console.error('Error creating verifier:', verifierError)
      return NextResponse.json({ error: 'Failed to register verifier' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      verifier,
      message: 'Application submitted successfully. You will be notified once approved.',
    })
  } catch (error: any) {
    console.error('Error in POST /api/verifier/register:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
