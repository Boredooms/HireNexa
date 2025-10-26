import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user role from database
    const { data: user, error } = await supabase
      .from('users')
      .select('role, is_recruiter, is_admin')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      role: user?.role || 'student',
      isRecruiter: user?.is_recruiter === true || user?.role === 'recruiter',
      isAdmin: user?.is_admin === true || user?.role === 'admin',
    })
  } catch (error) {
    console.error('Error in /api/user/role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
