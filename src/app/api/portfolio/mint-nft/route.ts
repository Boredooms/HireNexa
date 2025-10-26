import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// This endpoint prepares data for client-side minting
// Actual minting happens in browser with user's wallet
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { metadataIpfsHash, txHash, tokenId } = await req.json()

    // If txHash and tokenId provided, save to database
    if (txHash && tokenId !== undefined) {
      console.log(`💾 Saving NFT mint result: TX=${txHash}, Token=${tokenId}`)
      
      // Update ONLY the LATEST portfolio with NFT info
      // First, get the latest portfolio ID
      const { data: latestPortfolio, error: fetchError } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError || !latestPortfolio) {
        console.error('Error fetching latest portfolio:', fetchError)
        return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
      }

      // Update ONLY this specific portfolio
      const { error } = await supabase
        .from('portfolios')
        .update({
          nft_token_id: tokenId,
          blockchain_tx_hash: txHash,
          // nft_minted_at will be added via SQL migration
        })
        .eq('id', latestPortfolio.id)  // ✅ Update by ID, not user_id!

      if (error) {
        console.error('Error saving NFT info:', error)
        return NextResponse.json({ error: 'Failed to save NFT info' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'NFT info saved successfully',
        tokenId,
        txHash
      })
    }

    // Otherwise, return metadata for client-side minting
    return NextResponse.json({
      success: true,
      metadataIpfsHash,
      contractAddress: process.env.NEXT_PUBLIC_PORTFOLIO_NFT_CONTRACT,
    })
  } catch (error: any) {
    console.error('Error in mint-nft API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
