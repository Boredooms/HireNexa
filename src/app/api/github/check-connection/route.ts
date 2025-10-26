import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check Clerk authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ connected: false }, { status: 401 })
    }

    // Check if user has connected GitHub
    const supabase = createClient()
    
    const { data: user } = await supabase
      .from('users')
      .select('github_username')
      .eq('id', userId)
      .single()

    if (user && user.github_username) {
      return NextResponse.json({
        connected: true,
        username: user.github_username,
      })
    }

    return NextResponse.json({ connected: false })
  } catch (error) {
    console.error('Error checking GitHub connection:', error)
    return NextResponse.json({ connected: false }, { status: 500 })
  }
}
