import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: assignment, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json({ assignment })
  } catch (error: any) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
