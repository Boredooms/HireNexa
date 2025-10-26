import { NextRequest, NextResponse } from 'next/server'
import { JsonRpcProvider, Contract } from 'ethers'

const ESCROW_ABI = [
  "function assignmentCounter() view returns (uint256)",
  "function assignments(uint256) view returns (uint256 assignmentId, address recruiter, string title, string metadataURI, uint256 rewardAmount, uint256 maxSubmissions, uint256 currentSubmissions, bool autoVerify, uint8 status, uint256 createdAt, uint256 expiresAt)"
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || '10'

    const provider = new JsonRpcProvider('https://forno.celo-sepolia.celo-testnet.org')
    const escrowContract = new Contract(
      process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS!,
      ESCROW_ABI,
      provider
    )

    const counter = await escrowContract.assignmentCounter()
    
    try {
      const assignment = await escrowContract.assignments(id)
      
      const statusNames = ['Active', 'InProgress', 'Completed', 'Cancelled', 'Expired']
      
      return NextResponse.json({
        assignmentId: id,
        totalAssignments: counter.toString(),
        exists: assignment.recruiter !== '0x0000000000000000000000000000000000000000',
        assignment: {
          recruiter: assignment.recruiter,
          title: assignment.title,
          metadataURI: assignment.metadataURI,
          reward: assignment.rewardAmount.toString(),
          maxSubmissions: assignment.maxSubmissions.toString(),
          currentSubmissions: assignment.currentSubmissions.toString(),
          autoVerify: assignment.autoVerify,
          status: statusNames[assignment.status],
          statusCode: assignment.status,
          createdAt: new Date(Number(assignment.createdAt) * 1000).toISOString(),
          expiresAt: new Date(Number(assignment.expiresAt) * 1000).toISOString(),
          isExpired: Number(assignment.expiresAt) < Date.now() / 1000,
          canSubmit: assignment.status === 0 && Number(assignment.currentSubmissions) < Number(assignment.maxSubmissions) && Number(assignment.expiresAt) > Date.now() / 1000
        },
        diagnosis: assignment.status !== 0 
          ? `❌ Assignment status is "${statusNames[assignment.status]}" (not Active)`
          : Number(assignment.expiresAt) < Date.now() / 1000
          ? '❌ Assignment has expired'
          : Number(assignment.currentSubmissions) >= Number(assignment.maxSubmissions)
          ? '❌ Max submissions reached'
          : '✅ Assignment is active and accepting submissions'
      })
    } catch (error) {
      return NextResponse.json({
        assignmentId: id,
        totalAssignments: counter.toString(),
        exists: false,
        error: 'Assignment not found on blockchain'
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
