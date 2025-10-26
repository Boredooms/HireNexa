import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Try to get one user to see the schema
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({
        error: error.message,
        details: error,
      })
    }

    // Get column names from the first row
    const columns = data && data.length > 0 ? Object.keys(data[0]) : []

    return NextResponse.json({
      success: true,
      columns,
      sampleData: data,
      message: 'These are the actual columns in the users table',
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 })
  }
}
