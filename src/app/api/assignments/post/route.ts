import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { ipfsService } from '@/lib/ipfs/pinata'

/**
 * POST /api/assignments/post
 * Post a new assignment to the marketplace
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    console.log('🔍 DEBUG: Clerk userId:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role key to bypass RLS (since we're using Clerk auth, not Supabase auth)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user profile (create if not exists)
    let { data: user } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', userId)
      .single()

    // Create user if doesn't exist
    if (!user) {
      console.log('Creating user in Supabase:', userId)
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          role: 'recruiter',
          created_at: new Date().toISOString(),
        })

      if (userError) {
        console.error('Error creating user:', userError)
      }

      // Fetch again after creation
      const { data: newUser } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', userId)
        .single()
      
      user = newUser
    }

    if (!user?.wallet_address) {
      return NextResponse.json(
        { error: 'Wallet not connected. Please connect your wallet first.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const {
      title,
      description,
      company_name,
      assignment_type,
      difficulty_level,
      estimated_hours,
      reward_amount,
      required_skills,
      github_repo_url,
      github_issue_url,
      max_submissions,
      auto_verify,
      verification_criteria,
    } = body

    // Validation
    if (!title || title.length < 5) {
      return NextResponse.json(
        { error: 'Title must be at least 5 characters' },
        { status: 400 }
      )
    }

    if (!description || description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      )
    }

    if (!required_skills || required_skills.length === 0) {
      return NextResponse.json(
        { error: 'At least one skill is required' },
        { status: 400 }
      )
    }

    if (!reward_amount || reward_amount <= 0) {
      return NextResponse.json(
        { error: 'Reward amount must be greater than 0' },
        { status: 400 }
      )
    }

    if (!estimated_hours || estimated_hours <= 0) {
      return NextResponse.json(
        { error: 'Estimated hours must be greater than 0' },
        { status: 400 }
      )
    }

    // Upload full details to IPFS
    const assignmentData = {
      title,
      description,
      company_name,
      assignment_type,
      difficulty_level,
      estimated_hours,
      reward_amount,
      reward_currency: 'CELO',
      required_skills,
      github_repo_url,
      github_issue_url,
      verification_criteria,
      created_at: new Date().toISOString(),
    }

    const metadataIpfs = await ipfsService.uploadJSON(assignmentData)

    // Store assignment in database
    console.log('🔍 DEBUG: Inserting with employer_id:', userId)
    
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        employer_id: userId,
        title,
        description,
        company_name,
        assignment_type,
        difficulty_level,
        estimated_hours,
        reward_amount,
        reward_currency: 'CELO',
        required_skills,
        github_repo_url,
        github_issue_url,
        max_submissions: max_submissions || 3,
        current_submissions: 0,
        auto_verify: auto_verify || false,
        verification_criteria,
        status: 'active',
        employment_type: 'contract', // For compatibility
      })
      .select()
      .single()

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError)
      return NextResponse.json(
        { error: 'Failed to create assignment: ' + assignmentError.message },
        { status: 500 }
      )
    }

    // Return assignment data with IPFS hash for blockchain posting
    return NextResponse.json({
      success: true,
      assignment: {
        ...assignment,
      },
      metadataIpfs, // Return at top level for frontend
      message: 'Assignment created successfully!',
    })
  } catch (error: any) {
    console.error('Error in POST /api/assignments/post:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
