import { NextRequest, NextResponse } from 'next/server'
import { JsonRpcProvider, Contract } from 'ethers'

const ESCROW_ABI = [
  "function assignmentCounter() view returns (uint256)",
  "function assignments(uint256) view returns (uint256 assignmentId, address recruiter, string title, string metadataURI, uint256 rewardAmount, uint256 maxSubmissions, uint256 currentSubmissions, bool autoVerify, uint8 status, uint256 createdAt, uint256 expiresAt)"
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })
    }

    const provider = new JsonRpcProvider('https://forno.celo-sepolia.celo-testnet.org')
    const escrowContract = new Contract(
      process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS!,
      ESCROW_ABI,
      provider
    )

    try {
      const assignment = await escrowContract.assignments(id)
      const counter = await escrowContract.assignmentCounter()
      
      const statusNames = ['Active', 'InProgress', 'Completed', 'Cancelled', 'Expired']
      
      return NextResponse.json({
        exists: assignment.recruiter !== '0x0000000000000000000000000000000000000000',
        assignmentId: id,
        totalAssignments: counter.toString(),
        assignment: {
          recruiter: assignment.recruiter,
          title: assignment.title,
          reward: assignment.rewardAmount.toString(),
          maxSubmissions: assignment.maxSubmissions.toString(),
          currentSubmissions: assignment.currentSubmissions.toString(),
          status: statusNames[assignment.status],
          statusCode: assignment.status,
          expiresAt: new Date(Number(assignment.expiresAt) * 1000).toISOString(),
          isActive: assignment.status === 0, // Active = 0
          canSubmit: assignment.status === 0 && Number(assignment.currentSubmissions) < Number(assignment.maxSubmissions)
        }
      })
    } catch (error: any) {
      return NextResponse.json({
        exists: false,
        assignmentId: id,
        error: 'Assignment not found on blockchain',
        message: `Assignment ID ${id} does not exist. Try IDs 1-9.`
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
