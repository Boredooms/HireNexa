import { createClient } from '@/lib/supabase/server'
import { portfolioGenerator } from '@/lib/portfolio/generator'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get wallet address from request body (optional)
    const body = await request.json().catch(() => ({}))
    const { walletAddress } = body

    // Generate portfolio (with optional NFT minting)
    const result = await portfolioGenerator.generatePortfolio(user.id, walletAddress)

    return NextResponse.json({
      success: true,
      ipfsHash: result.ipfsHash,
      nftMetadataHash: result.nftMetadataHash,
      requiresMinting: result.requiresMinting,
      nftMinted: result.nftMinted,
    })
  } catch (error) {
    console.error('Error generating portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to generate portfolio' },
      { status: 500 }
    )
  }
}
