import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { JsonRpcProvider, Contract } from 'ethers'

const ESCROW_ABI = [
  "function assignments(uint256) view returns (uint256 assignmentId, address recruiter, string title, string metadataURI, uint256 rewardAmount, uint256 maxSubmissions, uint256 currentSubmissions, bool autoVerify, uint8 status, uint256 createdAt, uint256 expiresAt)"
]

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

    // Get all pending assignments
    const { data: pendingAssignments } = await supabase
      .from('assignments')
      .select('id, blockchain_job_id, title')
      .eq('blockchain_status', 'pending')
      .not('blockchain_job_id', 'is', null)

    if (!pendingAssignments || pendingAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending assignments to fix',
        fixed: 0
      })
    }

    // Connect to blockchain
    const provider = new JsonRpcProvider('https://forno.celo-sepolia.celo-testnet.org')
    const escrowContract = new Contract(
      process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS!,
      ESCROW_ABI,
      provider
    )

    const fixed = []
    const notFound = []

    // Check each assignment on blockchain
    for (const assignment of pendingAssignments) {
      try {
        const blockchainAssignment = await escrowContract.assignments(assignment.blockchain_job_id)
        
        // If assignment exists on blockchain, update status to confirmed
        if (blockchainAssignment.recruiter !== '0x0000000000000000000000000000000000000000') {
          const { error } = await supabase
            .from('assignments')
            .update({
              blockchain_status: 'confirmed',
              blockchain_tx_hash: 'recovered' // Mark as recovered
            })
            .eq('id', assignment.id)

          if (!error) {
            fixed.push({
              id: assignment.id,
              title: assignment.title,
              blockchain_job_id: assignment.blockchain_job_id
            })
          }
        }
      } catch (error) {
        notFound.push({
          id: assignment.id,
          blockchain_job_id: assignment.blockchain_job_id,
          error: 'Not found on blockchain'
        })
      }
    }

    return NextResponse.json({
      success: true,
      fixed: fixed.length,
      notFound: notFound.length,
      details: {
        fixed,
        notFound
      },
      message: `Fixed ${fixed.length} assignments, ${notFound.length} not found on blockchain`
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
