import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check current role
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    console.log('Current user:', user)

    // Force update to admin
    const { data: updated, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        error: 'Failed to update role',
        details: error.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User role verified and set to admin',
      before: user,
      after: updated,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 })
  }
}
