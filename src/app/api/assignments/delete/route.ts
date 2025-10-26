import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('id')

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

    // Check if user owns this assignment
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('employer_id')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignment.employer_id !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this assignment' }, { status: 403 })
    }

    // Delete related records first
    console.log('🗑️ Attempting to delete assignment:', assignmentId)
    
    // Delete certificates first (they reference submissions)
    const { error: certificatesError } = await supabase
      .from('certificates')
      .delete()
      .eq('related_assignment_id', assignmentId)

    if (certificatesError) {
      console.error('❌ Error deleting certificates:', certificatesError)
      // Continue anyway
    }

    // Delete payments
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('related_assignment_id', assignmentId)

    if (paymentsError) {
      console.error('❌ Error deleting payments:', paymentsError)
      // Continue anyway
    }
    
    // Delete submissions
    const { error: submissionsError } = await supabase
      .from('assignment_submissions')
      .delete()
      .eq('assignment_id', assignmentId)

    if (submissionsError) {
      console.error('❌ Error deleting submissions:', submissionsError)
      return NextResponse.json(
        { error: 'Failed to delete submissions: ' + submissionsError.message },
        { status: 500 }
      )
    }

    // Delete applications
    const { error: applicationsError } = await supabase
      .from('applications')
      .delete()
      .eq('assignment_id', assignmentId)

    if (applicationsError) {
      console.error('❌ Error deleting applications:', applicationsError)
      // Continue anyway
    }

    // Now delete the assignment
    const { data: deletedData, error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId)
      .select()

    if (deleteError) {
      console.error('❌ Error deleting assignment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete assignment: ' + deleteError.message },
        { status: 500 }
      )
    }

    console.log('✅ Assignment deleted successfully:', deletedData)

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
      deleted: deletedData,
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/assignments/delete:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
