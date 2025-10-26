import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId } = await request.json()

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify user owns this assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .select('employer_id')
      .eq('id', assignmentId)
      .single()

    if (!assignment || assignment.employer_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Close the assignment
    const { error: updateError } = await supabase
      .from('assignments')
      .update({
        status: 'closed',
      })
      .eq('id', assignmentId)

    if (updateError) {
      console.error('Error closing assignment:', updateError)
      return NextResponse.json(
        { error: 'Failed to close assignment: ' + updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment closed successfully',
    })
  } catch (error: any) {
    console.error('Error in POST /api/assignments/close:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
