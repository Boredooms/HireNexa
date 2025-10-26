import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Set this in your .env.local file
// ADMIN_SECRET_KEY=your-super-secret-key-here
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'change-this-in-production'

export async function POST(req: NextRequest) {
  try {
    const { email, secretKey } = await req.json()

    // Validate inputs
    if (!email || !secretKey) {
      return NextResponse.json(
        { error: 'Email and secret key are required' },
        { status: 400 }
      )
    }

    // Verify secret key
    if (secretKey !== ADMIN_SECRET_KEY) {
      console.warn(`⚠️ Failed admin creation attempt for email: ${email}`)
      return NextResponse.json(
        { error: 'Invalid admin secret key' },
        { status: 403 }
      )
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, is_admin, is_recruiter')
      .eq('email', email)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'User with this email does not exist. They must sign up first.' },
        { status: 404 }
      )
    }

    // Check if already admin
    if (existingUser.is_admin === true || existingUser.role === 'admin') {
      return NextResponse.json(
        { error: 'User is already an admin' },
        { status: 400 }
      )
    }

    // Update user to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: 'admin',
        is_admin: true,
        is_recruiter: true, // Admins have all recruiter permissions
      })
      .eq('email', email)

    if (updateError) {
      throw updateError
    }

    // Log admin creation
    console.log(`✅ Admin created successfully: ${email} (ID: ${existingUser.id})`)

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      userId: existingUser.id,
      email: email,
    })
  } catch (error: any) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
