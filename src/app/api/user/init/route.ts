import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        userId
      })
    }

    // Create new user record
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          role: 'student',
          is_recruiter: false,
          is_admin: false,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    console.log('User initialized:', userId)

    return NextResponse.json({
      success: true,
      message: 'User initialized successfully',
      user: newUser
    })
  } catch (error) {
    console.error('Error in /api/user/init:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
