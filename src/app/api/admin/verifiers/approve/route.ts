import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/verifiers/approve
 * Approve a verifier application
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check here
    // For now, any authenticated user can approve (for testing)

    const body = await req.json()
    const { verifier_id } = body

    if (!verifier_id) {
      return NextResponse.json({ error: 'Verifier ID required' }, { status: 400 })
    }

    const supabase = createClient()

    // Update verifier status to authorized
    const { data: verifier, error } = await supabase
      .from('verifier_reputation')
      .update({
        is_authorized: true,
        updated_at: new Date().toISOString(),
      })
      .eq('verifier_id', verifier_id)
      .select()
      .single()

    if (error) {
      console.error('Error approving verifier:', error)
      return NextResponse.json({ error: 'Failed to approve verifier' }, { status: 500 })
    }

    // Create notification for the verifier
    await supabase.from('notifications').insert({
      user_id: verifier_id,
      type: 'skill_verification',
      title: '🎉 Verifier Application Approved!',
      message:
        'Congratulations! Your application to become a skill verifier has been approved. You can now start verifying skills and earning 5 cUSD per verification.',
      action_url: '/dashboard/peer-review',
      read: false,
    })

    return NextResponse.json({
      success: true,
      verifier,
      message: 'Verifier approved successfully',
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/verifiers/approve:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
