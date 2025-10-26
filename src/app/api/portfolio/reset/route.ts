import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🗑️ Resetting portfolio for user:', userId)

    // Delete all portfolios for this user
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting portfolios:', deleteError)
      return NextResponse.json(
        { error: 'Failed to reset portfolio' },
        { status: 500 }
      )
    }

    console.log('✅ Portfolio reset successfully')

    return NextResponse.json({
      success: true,
      message: 'Portfolio reset successfully. You can now mint a fresh NFT!',
    })
  } catch (error: any) {
    console.error('Error resetting portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to reset portfolio', details: error.message },
      { status: 500 }
    )
  }
}
