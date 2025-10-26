import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { verifierId } = await req.json()
    const reviewerId = verifierId // Support both parameter names

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
      .from('peer_reviewer_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq('user_id', reviewerId)

    if (updateError) {
      throw updateError
    }

    // Update user role (keep admin if already admin)
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', reviewerId)
      .single()
    
    await supabase
      .from('users')
      .update({ 
        role: currentUser?.role === 'admin' ? 'admin' : 'verifier'
      })
      .eq('id', reviewerId)

    // Log admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: userId,
        action_type: 'assignment_approve',
        target_type: 'user',
        target_id: reviewerId,
        reason: 'Approved peer reviewer application',
      })

    return NextResponse.json({
      success: true,
      message: 'Peer reviewer approved successfully',
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/peer-reviewer/approve:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
