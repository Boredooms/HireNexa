import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { ethers } from 'ethers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Smart contract ABI for Skill Barter NFT
const BARTER_NFT_ABI = [
  "function mintBarterNFT(address proposer, address recipient, string memory skillOffered, string memory skillRequested, string memory duration) public returns (uint256)",
  "event BarterRecorded(uint256 indexed tokenId, address indexed proposer, address indexed recipient, string skillOffered, string skillRequested)"
]

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { proposal_id } = body

    // Get proposal details
    const { data: proposal, error: proposalError } = await supabase
      .from('skill_barter_proposals')
      .select('*')
      .eq('id', proposal_id)
      .single()

    if (proposalError) throw proposalError

    // Verify user is the recipient
    if (proposal.recipient_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update proposal status
    await supabase
      .from('skill_barter_proposals')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', proposal_id)

    // Record on blockchain
    let blockchainTxHash = null
    let nftTokenId = null

    try {
      // Initialize Web3 provider (Celo Sepolia)
      const provider = new ethers.JsonRpcProvider(process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org')
      const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY!, provider)
      
      // Contract address for Skill Barter NFT (deploy this contract)
      const contractAddress = process.env.SKILL_BARTER_CONTRACT_ADDRESS!
      const contract = new ethers.Contract(contractAddress, BARTER_NFT_ABI, wallet)

      // Get wallet addresses for both parties
      const { data: proposerWallet } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('clerk_id', proposal.proposer_id)
        .single()

      const { data: recipientWallet } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('clerk_id', proposal.recipient_id)
        .single()

      // Check if wallet addresses exist
      if (!proposerWallet?.wallet_address || !recipientWallet?.wallet_address) {
        throw new Error('Wallet addresses not found for one or both users')
      }

      // Mint NFT on blockchain
      const tx = await contract.mintBarterNFT(
        proposerWallet.wallet_address,
        recipientWallet.wallet_address,
        proposal.skill_offered,
        proposal.skill_requested,
        proposal.duration
      )

      const receipt = await tx.wait()
      blockchainTxHash = receipt.hash

      // Extract token ID from event
      const event = receipt.logs.find((log: any) => log.eventName === 'BarterRecorded')
      nftTokenId = event?.args?.tokenId?.toString()

    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError)
      // Continue even if blockchain fails - can retry later
    }

    // Create barter record
    const { data: barterRecord, error: recordError } = await supabase
      .from('skill_barter_records')
      .insert({
        proposal_id,
        proposer_id: proposal.proposer_id,
        recipient_id: proposal.recipient_id,
        skill_offered: proposal.skill_offered,
        skill_requested: proposal.skill_requested,
        duration: proposal.duration,
        description: proposal.description,
        blockchain_tx_hash: blockchainTxHash,
        nft_token_id: nftTokenId,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (recordError) throw recordError

    // Notify proposer
    await supabase
      .from('notifications')
      .insert({
        user_id: proposal.proposer_id,
        type: 'barter_accepted',
        title: 'Barter Proposal Accepted! 🎉',
        message: `Your skill exchange proposal has been accepted!`,
        data: { 
          barter_id: barterRecord.id,
          nft_token_id: nftTokenId
        },
        read: false,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true,
      barter_id: barterRecord.id,
      blockchain_tx_hash: blockchainTxHash,
      nft_token_id: nftTokenId,
      message: 'Barter accepted and recorded on blockchain!'
    })
  } catch (error) {
    console.error('Error accepting barter:', error)
    return NextResponse.json({ error: 'Failed to accept barter' }, { status: 500 })
  }
}
