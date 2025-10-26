import { ethers, BrowserProvider, Contract, parseEther, formatEther } from 'ethers'
import { CELO_SEPOLIA_CONFIG } from './celoConfig'

// Contract ABIs (simplified - add full ABI after deployment)
const ESCROW_ABI = [
  "function createAssignment(string title, string metadataURI, uint256 rewardAmount, uint256 maxSubmissions, bool autoVerify, uint256 expiresAt) external payable returns (uint256)",
  "function submitSolution(uint256 assignmentId, string githubPRUrl, string submissionURI) external returns (uint256)",
  "function updateVerification(uint256 submissionId, uint256 aiScore, bool githubPassed) external",
  "function approveSubmission(uint256 submissionId) external",
  "function rejectSubmission(uint256 submissionId) external",
  "function mintCertificate(uint256 submissionId) external",
  "function cancelAssignment(uint256 assignmentId) external",
  "function withdrawUnusedEscrow(uint256 assignmentId) external",
  "function getAssignment(uint256 assignmentId) external view returns (tuple(uint256 assignmentId, address recruiter, string title, string metadataURI, uint256 rewardAmount, uint256 maxSubmissions, uint256 currentSubmissions, bool autoVerify, uint8 status, uint256 createdAt, uint256 expiresAt))",
  "function getSubmission(uint256 submissionId) external view returns (tuple(uint256 submissionId, uint256 assignmentId, address candidate, string githubPRUrl, string submissionURI, uint256 aiVerificationScore, bool githubChecksPassed, uint8 status, uint256 submittedAt, uint256 reviewedAt))",
  "function getAssignmentSubmissions(uint256 assignmentId) external view returns (uint256[])",
  "event AssignmentCreated(uint256 indexed assignmentId, address indexed recruiter, uint256 rewardAmount, string title)",
  "event SubmissionCreated(uint256 indexed submissionId, uint256 indexed assignmentId, address indexed candidate, string githubPRUrl)",
  "event SubmissionReviewed(uint256 indexed submissionId, uint8 status, address reviewer)",
  "event RewardPaid(uint256 indexed submissionId, address indexed candidate, uint256 amount)",
  "event CertificateMinted(uint256 indexed submissionId, address indexed candidate, uint256 tokenId)"
]

const CERTIFICATE_ABI = [
  "function mintCertificateWithDetails(address recipient, uint256 submissionId, uint256 assignmentId, string assignmentTitle, string metadataURI) external returns (uint256)",
  "function getUserCertificates(address user) external view returns (uint256[])",
  "function getCertificate(uint256 tokenId) external view returns (tuple(uint256 tokenId, address recipient, uint256 submissionId, uint256 assignmentId, string assignmentTitle, string metadataURI, uint256 issuedAt, bool revoked))",
  "function isValid(uint256 tokenId) external view returns (bool)",
  "function totalSupply() external view returns (uint256)",
  "event CertificateMinted(uint256 indexed tokenId, address indexed recipient, uint256 indexed submissionId, string assignmentTitle)"
]

const CELO_TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)"
]

export class AssignmentEscrowService {
  private provider: BrowserProvider
  private escrowContract: Contract
  private certificateContract: Contract
  private celoTokenContract: Contract

  constructor(provider: BrowserProvider) {
    this.provider = provider

    const escrowAddress = process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS!
    const certificateAddress = process.env.NEXT_PUBLIC_ASSIGNMENT_CERTIFICATE_ADDRESS!
    const celoTokenAddress = process.env.NEXT_PUBLIC_CELO_TOKEN_ADDRESS!

    this.escrowContract = new Contract(escrowAddress, ESCROW_ABI, provider)
    this.certificateContract = new Contract(certificateAddress, CERTIFICATE_ABI, provider)
    this.celoTokenContract = new Contract(celoTokenAddress, CELO_TOKEN_ABI, provider)
  }

  /**
   * Create a new assignment with escrow
   */
  async createAssignment(
    title: string,
    metadataURI: string,
    rewardAmount: string, // in CELO
    maxSubmissions: number,
    autoVerify: boolean,
    expiresAt: Date
  ): Promise<{ assignmentId: number; txHash: string }> {
    const signer = await this.provider.getSigner()
    const escrowWithSigner = this.escrowContract.connect(signer) as any
    const celoWithSigner = this.celoTokenContract.connect(signer) as any

    // Convert CELO to wei
    const rewardWei = parseEther(rewardAmount)
    const totalEscrow = rewardWei * BigInt(maxSubmissions)

    // Check balance (native CELO, not ERC-20)
    const userAddress = await signer.getAddress()
    const balance = await this.provider.getBalance(userAddress)
    if (balance < totalEscrow) {
      throw new Error(`Insufficient CELO balance. Need ${formatEther(totalEscrow)} CELO, have ${formatEther(balance)} CELO`)
    }

    console.log(`✅ Balance check passed: ${formatEther(balance)} CELO available`)

    // Create assignment with native CELO payment
    const expiresAtTimestamp = Math.floor(expiresAt.getTime() / 1000)
    
    console.log('Creating assignment on blockchain...')
    console.log('Contract address:', await this.escrowContract.getAddress())
    console.log('Parameters:', {
      title,
      metadataURI,
      rewardWei: rewardWei.toString(),
      maxSubmissions,
      autoVerify,
      expiresAtTimestamp,
      value: totalEscrow.toString()
    })

    try {
      const tx = await escrowWithSigner.createAssignment(
        title,
        metadataURI,
        rewardWei,
        maxSubmissions,
        autoVerify,
        expiresAtTimestamp,
        { value: totalEscrow } // Send native CELO with transaction
      )
      
      if (!tx) {
        throw new Error('Transaction returned undefined - contract call failed')
      }
      
      console.log('Transaction sent:', tx.hash)

      const receipt = await tx.wait()

      // Get assignment ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.escrowContract.interface.parseLog(log)
          return parsed?.name === 'AssignmentCreated'
        } catch { return false }
      })
      const parsed = event ? this.escrowContract.interface.parseLog(event) : null
      const assignmentId = parsed ? Number(parsed.args.assignmentId) : 0

      return {
        assignmentId,
        txHash: receipt.transactionHash
      }
    } catch (error: any) {
      console.error('Error creating assignment:', error)
      throw new Error(`Failed to create assignment: ${error.message || error}`)
    }
  }

  /**
   * Submit a solution for an assignment
   */
  async submitSolution(
    assignmentId: number,
    githubPRUrl: string,
    submissionURI: string
  ): Promise<{ submissionId: number; txHash: string }> {
    const signer = await this.provider.getSigner()
    const escrowWithSigner = this.escrowContract.connect(signer) as any

    console.log('Submitting solution on blockchain...')
    console.log('Assignment ID:', assignmentId)
    console.log('GitHub PR URL:', githubPRUrl)
    console.log('Submission URI:', submissionURI)

    try {
      const tx = await escrowWithSigner.submitSolution(
        assignmentId,
        githubPRUrl,
        submissionURI
      )

      console.log('Transaction sent:', tx.hash)
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt.status)

      if (receipt.status === 0) {
        throw new Error('Transaction failed on blockchain. The assignment may not exist, be inactive, or max submissions reached.')
      }

      // Get submission ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.escrowContract.interface.parseLog(log)
          return parsed?.name === 'SubmissionCreated'
        } catch { return false }
      })
      const parsed = event ? this.escrowContract.interface.parseLog(event) : null
      const submissionId = parsed ? Number(parsed.args.submissionId) : 0

      return {
        submissionId,
        txHash: receipt.transactionHash
      }
    } catch (error: any) {
      console.error('Blockchain submission error:', error)
      throw new Error(`Blockchain submission failed: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Update verification status (owner only)
   * Changes status from Pending to Reviewing
   */
  async updateVerification(
    submissionId: number,
    aiScore: number,
    githubPassed: boolean
  ): Promise<string> {
    const signer = await this.provider.getSigner()
    const escrowWithSigner = this.escrowContract.connect(signer) as any

    console.log('Updating verification...')
    const tx = await escrowWithSigner.updateVerification(submissionId, aiScore, githubPassed)
    const receipt = await tx.wait()

    return receipt.hash
  }

  /**
   * Approve a submission (recruiter only)
   */
  async approveSubmission(submissionId: number): Promise<string> {
    const signer = await this.provider.getSigner()
    const escrowWithSigner = this.escrowContract.connect(signer) as any

    console.log('Approving submission...')
    const tx = await escrowWithSigner.approveSubmission(submissionId)
    const receipt = await tx.wait()

    return receipt.hash
  }

  /**
   * Reject a submission (recruiter only)
   */
  async rejectSubmission(submissionId: number): Promise<string> {
    const signer = await this.provider.getSigner()
    const escrowWithSigner = this.escrowContract.connect(signer) as any

    console.log('Rejecting submission...')
    const tx = await escrowWithSigner.rejectSubmission(submissionId)
    const receipt = await tx.wait()

    return receipt.hash
  }

  /**
   * Mint certificate NFT for approved submission
   */
  async mintCertificate(submissionId: number): Promise<{ tokenId: number; txHash: string }> {
    const signer = await this.provider.getSigner()
    const escrowWithSigner = this.escrowContract.connect(signer) as any

    console.log('Minting certificate NFT...')
    const tx = await escrowWithSigner.mintCertificate(submissionId)
    const receipt = await tx.wait()

    // Get token ID from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = this.escrowContract.interface.parseLog(log)
        return parsed?.name === 'CertificateMinted'
      } catch { return false }
    })
    const parsed = event ? this.escrowContract.interface.parseLog(event) : null
    const tokenId = parsed ? Number(parsed.args.tokenId) : 0

    return {
      tokenId,
      txHash: receipt.transactionHash
    }
  }

  /**
   * Cancel an assignment (recruiter only)
   */
  async cancelAssignment(assignmentId: number): Promise<string> {
    const signer = await this.provider.getSigner()
    const escrowWithSigner = this.escrowContract.connect(signer) as any

    console.log('Cancelling assignment...')
    const tx = await escrowWithSigner.cancelAssignment(assignmentId)
    const receipt = await tx.wait()

    return receipt.hash
  }

  /**
   * Withdraw unused escrow after expiration
   */
  async withdrawUnusedEscrow(assignmentId: number): Promise<string> {
    const signer = await this.provider.getSigner()
    const escrowWithSigner = this.escrowContract.connect(signer) as any

    console.log('Withdrawing unused escrow...')
    const tx = await escrowWithSigner.withdrawUnusedEscrow(assignmentId)
    const receipt = await tx.wait()

    return receipt.hash
  }

  /**
   * Get assignment details from blockchain
   */
  async getAssignment(assignmentId: number) {
    const assignment = await this.escrowContract.getAssignment(assignmentId)
    
    return {
      assignmentId: assignment.assignmentId.toNumber(),
      recruiter: assignment.recruiter,
      title: assignment.title,
      metadataURI: assignment.metadataURI,
      rewardAmount: formatEther(assignment.rewardAmount),
      maxSubmissions: Number(assignment.maxSubmissions),
      currentSubmissions: Number(assignment.currentSubmissions),
      autoVerify: assignment.autoVerify,
      status: assignment.status,
      createdAt: new Date(Number(assignment.createdAt) * 1000),
      expiresAt: new Date(Number(assignment.expiresAt) * 1000)
    }
  }

  /**
   * Get submission details from blockchain
   */
  async getSubmission(submissionId: number) {
    const submission = await this.escrowContract.getSubmission(submissionId)
    
    return {
      submissionId: Number(submission.submissionId),
      assignmentId: Number(submission.assignmentId),
      candidate: submission.candidate,
      githubPRUrl: submission.githubPRUrl,
      submissionURI: submission.submissionURI,
      aiVerificationScore: Number(submission.aiVerificationScore),
      githubChecksPassed: submission.githubChecksPassed,
      status: submission.status,
      submittedAt: new Date(Number(submission.submittedAt) * 1000),
      reviewedAt: Number(submission.reviewedAt) > 0 
        ? new Date(Number(submission.reviewedAt) * 1000) 
        : null
    }
  }

  /**
   * Get all submissions for an assignment
   */
  async getAssignmentSubmissions(assignmentId: number): Promise<number[]> {
    const submissionIds = await this.escrowContract.getAssignmentSubmissions(assignmentId)
    return submissionIds.map((id: bigint) => Number(id))
  }

  /**
   * Get user's certificates
   */
  async getUserCertificates(userAddress: string): Promise<number[]> {
    const tokenIds = await this.certificateContract.getUserCertificates(userAddress)
    return tokenIds.map((id: bigint) => Number(id))
  }

  /**
   * Get certificate details
   */
  async getCertificate(tokenId: number) {
    const cert = await this.certificateContract.getCertificate(tokenId)
    
    return {
      tokenId: Number(cert.tokenId),
      recipient: cert.recipient,
      submissionId: Number(cert.submissionId),
      assignmentId: Number(cert.assignmentId),
      assignmentTitle: cert.assignmentTitle,
      metadataURI: cert.metadataURI,
      issuedAt: new Date(Number(cert.issuedAt) * 1000),
      revoked: cert.revoked
    }
  }

  /**
   * Check if certificate is valid
   */
  async isCertificateValid(tokenId: number): Promise<boolean> {
    return await this.certificateContract.isValid(tokenId)
  }

  /**
   * Get CELO balance
   */
  async getCeloBalance(address: string): Promise<string> {
    const balance = await this.celoTokenContract.balanceOf(address)
    return formatEther(balance)
  }
}
