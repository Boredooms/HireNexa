import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recruiterId } = await req.json()
    console.log('🔍 Received recruiterId:', recruiterId)
    console.log('🔍 Admin userId:', userId)

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user is admin (check both role and is_admin flag)
    const { data: admin } = await supabase
      .from('users')
      .select('role, is_admin')
      .eq('id', userId)
      .single()

    if (admin?.role !== 'admin' && admin?.is_admin !== true) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Update application status
    const { data: updateData, error: updateError } = await supabase
      .from('recruiter_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq('user_id', recruiterId)
      .select()

    console.log('📝 Update result:', { updateData, updateError })

    if (updateError) {
      throw updateError
    }

    if (!updateData || updateData.length === 0) {
      throw new Error(`No application found for user_id: ${recruiterId}`)
    }

    // Create recruiter permission record
    const { error: permError } = await supabase
      .from('recruiter_permissions')
      .upsert({
        user_id: recruiterId,
        company_name: 'Approved Recruiter',
        can_post_assignments: true,
        can_review_submissions: true,
        can_issue_certificates: true,
        can_make_payments: true,
        is_verified: true,
      })

    if (permError) {
      console.error('Error creating recruiter permission:', permError)
    }

    // Update user role and flags (keep admin if already admin)
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, is_admin')
      .eq('id', recruiterId)
      .single()
    
    const isCurrentlyAdmin = currentUser?.role === 'admin' || currentUser?.is_admin === true
    
    await supabase
      .from('users')
      .update({ 
        role: isCurrentlyAdmin ? 'admin' : 'recruiter',
        is_recruiter: true,
        is_admin: isCurrentlyAdmin // Keep admin flag if already admin
      })
      .eq('id', recruiterId)

    // Log admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: userId,
        action_type: 'assignment_approve',
        target_type: 'user',
        target_id: recruiterId,
        reason: 'Approved recruiter application',
      })

    return NextResponse.json({
      success: true,
      message: 'Recruiter approved successfully',
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/recruiter/approve:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
