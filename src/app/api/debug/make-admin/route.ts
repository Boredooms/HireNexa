import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

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

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!existingUser) {
      // Create user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          role: 'admin',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json({
          error: 'Failed to create user',
          details: createError.message,
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'User created and set as admin!',
        user: newUser,
      })
    }

    // Update existing user to admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to update user role',
        details: updateError.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User role updated to admin!',
      user: updatedUser,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 })
  }
}
