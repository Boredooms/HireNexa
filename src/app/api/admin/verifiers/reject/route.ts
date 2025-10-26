import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/verifiers/reject
 * Reject a verifier application
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check here
    // For now, any authenticated user can reject (for testing)

    const body = await req.json()
    const { verifier_id, reason } = body

    if (!verifier_id) {
      return NextResponse.json({ error: 'Verifier ID required' }, { status: 400 })
    }

    const supabase = createClient()

    // Delete the verifier application
    const { error } = await supabase
      .from('verifier_reputation')
      .delete()
      .eq('verifier_id', verifier_id)

    if (error) {
      console.error('Error rejecting verifier:', error)
      return NextResponse.json({ error: 'Failed to reject verifier' }, { status: 500 })
    }

    // Create notification for the verifier
    await supabase.from('notifications').insert({
      user_id: verifier_id,
      type: 'skill_verification',
      title: 'Verifier Application Update',
      message: reason || 'Your verifier application was not approved at this time.',
      action_url: '/dashboard/peer-review',
      read: false,
    })

    return NextResponse.json({
      success: true,
      message: 'Verifier application rejected',
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/verifiers/reject:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
