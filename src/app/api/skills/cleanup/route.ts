import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`🧹 Cleaning up duplicate skills for user: ${userId}`)

    // Get current skill count
    const { count: beforeCount } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    console.log(`📊 Current skills: ${beforeCount}`)

    // Delete all skills for this user
    const { error: deleteError } = await supabase
      .from('skills')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting skills:', deleteError)
      return NextResponse.json({ error: 'Failed to delete skills' }, { status: 500 })
    }

    // Verify deletion
    const { count: afterCount } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    console.log(`✅ Skills deleted: ${beforeCount} → ${afterCount}`)

    return NextResponse.json({
      success: true,
      message: 'All skills deleted. Sync GitHub to regenerate with deduplication.',
      deletedCount: beforeCount,
      remainingCount: afterCount,
    })
  } catch (error: any) {
    console.error('Error in cleanup:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
