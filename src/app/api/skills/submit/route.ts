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
      skill_name,
      skill_category,
      proficiency_level,
      description,
      github_repos,
      portfolio_links,
      certificates_ipfs,
      code_samples_ipfs,
    } = body

    // Validate required fields
    if (!skill_name || !skill_category || !proficiency_level || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (description.length < 100) {
      return NextResponse.json(
        { error: 'Description must be at least 100 characters' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create skill submission request
    const { data: submission, error: insertError } = await supabase
      .from('skill_submission_requests')
      .insert({
        user_id: userId,
        skill_name,
        skill_category,
        proficiency_level,
        description,
        github_repos: github_repos || [],
        portfolio_links: portfolio_links || [],
        certificates_ipfs: certificates_ipfs || [],
        code_samples_ipfs: code_samples_ipfs || null,
        status: 'pending_payment',
        payment_amount: 5.5, // 5 cUSD for reviewer + 0.5 platform fee
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating skill submission:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit skill for verification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Skill submitted successfully. Please complete payment to proceed.',
      submission,
    })
  } catch (error: any) {
    console.error('Error in POST /api/skills/submit:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
