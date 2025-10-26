import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/verifiers/pending
 * Get all pending verifier applications
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check here
    // For now, any authenticated user can access (for testing)

    const supabase = createClient()

    // Get all verifier applications with user details
    const { data: verifiers, error } = await supabase
      .from('verifier_reputation')
      .select(
        `
        *,
        user:users!verifier_reputation_verifier_id_fkey (
          id,
          full_name,
          email,
          github_username,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching verifiers:', error)
      return NextResponse.json({ error: 'Failed to fetch verifiers' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      verifiers: verifiers || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/verifiers/pending:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
