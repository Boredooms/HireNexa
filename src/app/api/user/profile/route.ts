import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Get user profile from database
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error in profile endpoint:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
