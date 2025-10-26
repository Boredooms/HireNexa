import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { JsonRpcProvider, Contract } from 'ethers'

const ESCROW_ABI = [
  "function assignmentCounter() view returns (uint256)"
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

    // Get max assignment ID from blockchain
    const provider = new JsonRpcProvider('https://forno.celo-sepolia.celo-testnet.org')
    const escrowContract = new Contract(
      process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS!,
      ESCROW_ABI,
      provider
    )

    const counter = await escrowContract.assignmentCounter()
    const maxBlockchainId = Number(counter)

    // Find all assignments with blockchain_job_id > maxBlockchainId
    const { data: orphanedAssignments } = await supabase
      .from('assignments')
      .select('id, title, blockchain_job_id')
      .gt('blockchain_job_id', maxBlockchainId)

    if (!orphanedAssignments || orphanedAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orphaned assignments found',
        deleted: 0
      })
    }

    // Delete orphaned assignments
    const deletedIds = []
    for (const assignment of orphanedAssignments) {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id)

      if (!error) {
        deletedIds.push(assignment)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedIds.length} orphaned assignments`,
      deleted: deletedIds.length,
      assignments: deletedIds,
      maxBlockchainId
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
