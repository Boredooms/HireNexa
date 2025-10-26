import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { ipfsService } from '@/lib/ipfs/pinata'

/**
 * POST /api/assignments/submit
 * Submit a solution for an assignment
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user info from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server')
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Ensure user exists in Supabase (upsert to avoid conflicts)
    console.log('🔍 Checking/creating user in Supabase:', userId)
    
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!existingUser) {
      // Create new user - match actual schema (id, email, full_name, role)
      const email = user.emailAddresses[0]?.emailAddress || `${userId}@temp.com`
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
      
      console.log('Creating user with:', { id: userId, email, fullName })
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
          role: 'student',
        })

      if (insertError) {
        console.error('❌ Error creating user:', insertError)
        return NextResponse.json(
          { error: 'Failed to create user profile: ' + insertError.message },
          { status: 500 }
        )
      }
      console.log('✅ User created in Supabase')
    } else {
      console.log('✅ User already exists in Supabase')
    }

    const body = await req.json()
    const {
      assignment_id,
      github_pr_url,
      submission_notes,
    } = body

    // Validation
    if (!assignment_id) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })
    }

    if (!github_pr_url) {
      return NextResponse.json({ error: 'GitHub PR URL required' }, { status: 400 })
    }

    // Validate GitHub PR URL format
    const githubPRRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/pull\/\d+$/
    if (!githubPRRegex.test(github_pr_url)) {
      return NextResponse.json(
        { error: 'Invalid GitHub PR URL format. Expected: https://github.com/owner/repo/pull/123' },
        { status: 400 }
      )
    }

    // Check if assignment exists and is active
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignment_id)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignment.status !== 'active') {
      return NextResponse.json({ error: 'Assignment is not active' }, { status: 400 })
    }

    // Check if max submissions reached
    if (assignment.current_submissions >= assignment.max_submissions) {
      return NextResponse.json(
        { error: 'Maximum submissions reached for this assignment' },
        { status: 400 }
      )
    }

    // Check if already submitted
    const { data: existingSubmission } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignment_id)
      .eq('candidate_id', userId)
      .single()

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted a solution for this assignment' },
        { status: 400 }
      )
    }

    // Get candidate's skills for matching
    const { data: candidateSkills } = await supabase
      .from('skills')
      .select('skill_name, confidence_score')
      .eq('user_id', userId)
      .eq('revoked', false)

    // Calculate skill match
    const skillMatchPercentage = calculateSkillMatchPercentage(
      assignment.required_skills,
      candidateSkills?.map((s) => s.skill_name) || []
    )

    // Upload submission details to IPFS
    const submissionData = {
      assignment_id,
      candidate_id: userId,
      github_pr_url,
      submission_notes,
      submitted_at: new Date().toISOString(),
      skill_match_percentage: skillMatchPercentage,
    }

    const submissionIpfs = await ipfsService.uploadJSON(submissionData)

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id,
        candidate_id: userId,
        github_pr_url,
        submission_notes,
        github_checks_passed: false,
        manual_review_required: true,
        review_status: 'pending',
        is_winner: false,
        reward_paid: false,
        certificate_minted: false,
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      return NextResponse.json(
        { error: 'Failed to create submission: ' + submissionError.message },
        { status: 500 }
      )
    }

    // Increment submissions count
    await supabase
      .from('assignments')
      .update({ 
        current_submissions: assignment.current_submissions + 1,
        applications_count: (assignment.applications_count || 0) + 1 
      })
      .eq('id', assignment_id)

    // Create notification for employer
    await supabase.from('notifications').insert({
      user_id: assignment.employer_id,
      type: 'new_submission',
      title: 'New Assignment Submission 📝',
      message: `A student submitted a solution for: ${assignment.title}`,
      data: {
        assignment_id,
        submission_id: submission.id,
        candidate_id: userId,
        github_pr_url,
      },
    })

    // Return submission data with IPFS hash for blockchain
    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
      },
      submissionURI: `ipfs://${submissionIpfs}`,
      message: 'Submission created successfully! The recruiter will review your solution.',
    })
  } catch (error: any) {
    console.error('Error in POST /api/assignments/submit:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function
function calculateSkillMatchPercentage(
  requiredSkills: string[],
  candidateSkills: string[]
): number {
  if (!requiredSkills || requiredSkills.length === 0) return 0

  const matchedSkills = requiredSkills.filter((skill) =>
    candidateSkills.some((cs) => cs.toLowerCase().includes(skill.toLowerCase()))
  )

  return Math.round((matchedSkills.length / requiredSkills.length) * 100)
}
