import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/assignments/list
 * Get all active assignments
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/assignments/list:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
