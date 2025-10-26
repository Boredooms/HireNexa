import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

/**
 * DELETE all submissions that don't have blockchain_submission_id
 * These are failed submissions that never made it to the blockchain
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all failed submissions (no blockchain_submission_id)
    const { data: failedSubmissions } = await supabase
      .from('assignment_submissions')
      .select('id, assignment_id, candidate_id')
      .is('blockchain_submission_id', null)

    console.log('Found failed submissions:', failedSubmissions?.length)

    // Delete them
    const { error: deleteError } = await supabase
      .from('assignment_submissions')
      .delete()
      .is('blockchain_submission_id', null)

    if (deleteError) {
      console.error('Error deleting failed submissions:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete: ' + deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: failedSubmissions?.length || 0,
      message: 'Failed submissions cleaned up successfully',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
