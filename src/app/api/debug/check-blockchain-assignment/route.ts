import { NextRequest, NextResponse } from 'next/server'
import { JsonRpcProvider, Contract } from 'ethers'

const ESCROW_ABI = [
  "function assignments(uint256) view returns (address employer, string title, string metadataURI, uint256 reward, uint256 maxSubmissions, uint256 currentSubmissions, uint256 expiresAt, bool autoVerify, bool active, bool cancelled)",
  "function getAssignment(uint256 assignmentId) view returns (tuple(address employer, string title, string metadataURI, uint256 reward, uint256 maxSubmissions, uint256 currentSubmissions, uint256 expiresAt, bool autoVerify, bool active, bool cancelled))"
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const blockchainId = searchParams.get('id')

    if (!blockchainId) {
      return NextResponse.json({ error: 'Blockchain ID required' }, { status: 400 })
    }

    // Connect to Celo Sepolia
    const provider = new JsonRpcProvider('https://forno.celo-sepolia.celo-testnet.org')
    const contractAddress = process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS || process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_CONTRACT
    
    if (!contractAddress) {
      return NextResponse.json({ 
        error: 'Contract address not configured',
        hint: 'Add NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS to .env.local'
      }, { status: 500 })
    }
    
    const escrowContract = new Contract(
      contractAddress,
      ESCROW_ABI,
      provider
    )

    // Get assignment from blockchain
    const assignment = await escrowContract.getAssignment(blockchainId)

    return NextResponse.json({
      blockchainId,
      assignment: {
        employer: assignment.employer,
        title: assignment.title,
        metadataURI: assignment.metadataURI,
        reward: assignment.reward.toString(),
        maxSubmissions: assignment.maxSubmissions.toString(),
        currentSubmissions: assignment.currentSubmissions.toString(),
        expiresAt: new Date(Number(assignment.expiresAt) * 1000).toISOString(),
        autoVerify: assignment.autoVerify,
        active: assignment.active,
        cancelled: assignment.cancelled,
      },
      diagnosis: {
        isActive: assignment.active,
        isCancelled: assignment.cancelled,
        isExpired: Number(assignment.expiresAt) < Date.now() / 1000,
        canAcceptSubmissions: assignment.active && !assignment.cancelled && Number(assignment.currentSubmissions) < Number(assignment.maxSubmissions),
        submissionsRemaining: Number(assignment.maxSubmissions) - Number(assignment.currentSubmissions),
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      details: error 
    }, { status: 500 })
  }
}
