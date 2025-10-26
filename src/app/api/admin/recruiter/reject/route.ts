import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recruiterId, reason } = await req.json()

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason required' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user is admin
    const { data: admin } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Update application status
    const { error: updateError } = await supabase
      .from('recruiter_applications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq('user_id', recruiterId)

    if (updateError) {
      throw updateError
    }

    // Log admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: userId,
        action_type: 'assignment_reject',
        target_type: 'user',
        target_id: recruiterId,
        reason: `Rejected recruiter application: ${reason}`,
      })

    return NextResponse.json({
      success: true,
      message: 'Recruiter rejected successfully',
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/recruiter/reject:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
