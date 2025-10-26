import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { JsonRpcProvider, Contract } from 'ethers'

const ESCROW_ABI = [
  "function assignmentCounter() view returns (uint256)",
  "function assignments(uint256) view returns (uint256 assignmentId, address recruiter, string title, string metadataURI, uint256 rewardAmount, uint256 maxSubmissions, uint256 currentSubmissions, bool autoVerify, uint8 status, uint256 createdAt, uint256 expiresAt)"
]

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all assignments from database
    const { data: dbAssignments } = await supabase
      .from('assignments')
      .select('id, title, blockchain_job_id, blockchain_status, status')
      .not('blockchain_job_id', 'is', null)
      .order('created_at', { ascending: false })

    if (!dbAssignments) {
      return NextResponse.json({ error: 'No assignments found' }, { status: 404 })
    }

    // Connect to blockchain
    const provider = new JsonRpcProvider('https://forno.celo-sepolia.celo-testnet.org')
    const escrowContract = new Contract(
      process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS!,
      ESCROW_ABI,
      provider
    )

    const counter = await escrowContract.assignmentCounter()
    const maxId = Number(counter)

    // Check each assignment
    const orphaned = []
    const valid = []

    for (const assignment of dbAssignments) {
      const blockchainId = assignment.blockchain_job_id

      // Check if ID is beyond counter
      if (blockchainId > maxId) {
        orphaned.push({
          ...assignment,
          reason: `Blockchain ID ${blockchainId} > max ID ${maxId} (doesn't exist)`
        })
        continue
      }

      // Check if assignment exists on blockchain
      try {
        const blockchainAssignment = await escrowContract.assignments(blockchainId)
        
        if (blockchainAssignment.recruiter === '0x0000000000000000000000000000000000000000') {
          orphaned.push({
            ...assignment,
            reason: 'Assignment not found on blockchain (empty recruiter)'
          })
        } else {
          valid.push({
            ...assignment,
            blockchainStatus: ['Active', 'InProgress', 'Completed', 'Cancelled', 'Expired'][blockchainAssignment.status]
          })
        }
      } catch (error) {
        orphaned.push({
          ...assignment,
          reason: 'Error checking blockchain'
        })
      }
    }

    return NextResponse.json({
      summary: {
        total: dbAssignments.length,
        valid: valid.length,
        orphaned: orphaned.length,
        maxBlockchainId: maxId
      },
      orphaned,
      valid,
      recommendation: orphaned.length > 0 
        ? 'Delete orphaned assignments and recreate them'
        : 'All assignments are valid!'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
