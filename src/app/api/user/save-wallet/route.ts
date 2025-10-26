import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Save wallet address to user profile
 * Called when user connects MetaMask
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { walletAddress } = await request.json()

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const supabase = createClient()

    // Update user's wallet address
    const { error } = await supabase
      .from('users')
      .update({ wallet_address: walletAddress.toLowerCase() })
      .eq('id', userId)

    if (error) {
      console.error('Error saving wallet address:', error)
      return NextResponse.json({ error: 'Failed to save wallet address' }, { status: 500 })
    }

    console.log(`✅ Wallet address saved for user ${userId}: ${walletAddress}`)

    return NextResponse.json({
      success: true,
      message: 'Wallet address saved',
      walletAddress,
    })
  } catch (error: any) {
    console.error('Error in save-wallet endpoint:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
