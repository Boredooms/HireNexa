import { ethers } from 'ethers'

// PeerReviewEscrow ABI (simplified - add full ABI after deployment)
const PEER_REVIEW_ESCROW_ABI = [
  'function payForVerification(uint256 submissionId) external payable',
  'function completeVerification(uint256 reviewId, address reviewer, uint8 confidenceScore) external',
  'function getVerification(uint256 verificationId) external view returns (tuple(uint256 verificationId, address reviewer, address skillOwner, string skillName, uint8 status, uint8 confidenceScore, string verificationURI, uint256 createdAt, uint256 completedAt, bool rewardPaid))',
  'function platformFees() external view returns (uint256)',
  'function withdrawPlatformFees() external',
  'event VerificationCreated(uint256 indexed verificationId, address indexed reviewer, address indexed skillOwner, string skillName)',
  'event RewardPaid(uint256 indexed verificationId, address indexed reviewer, uint256 amount)',
]

// cUSD Token ABI
const CUSD_TOKEN_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
]

// Celo Sepolia Testnet (using native CELO)
const CELO_SEPOLIA_CHAIN_ID = 11142220 // Celo Sepolia
const CELO_SEPOLIA_RPC = 'https://forno.celo-sepolia.celo-testnet.org'

// Contract addresses (update after deployment)
const PEER_REVIEW_ESCROW_ADDRESS = process.env.NEXT_PUBLIC_PEER_REVIEW_ESCROW_ADDRESS || ''
// Using native CELO on Celo Sepolia (no token contract needed)
const USE_NATIVE_CELO = true

export class PeerReviewEscrowService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null
  private escrowContract: ethers.Contract | null = null
  private cusdContract: ethers.Contract | null = null

  /**
   * Connect to MetaMask and initialize contracts
   */
  async connect(): Promise<{ address: string; balance: string }> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' })

    // Create provider and signer
    this.provider = new ethers.BrowserProvider(window.ethereum)
    this.signer = await this.provider.getSigner()

    // Check network
    const network = await this.provider.getNetwork()
    if (Number(network.chainId) !== CELO_SEPOLIA_CHAIN_ID) {
      await this.switchToCeloSepolia()
    }

    // Check if contract address is set
    if (!PEER_REVIEW_ESCROW_ADDRESS) {
      throw new Error('Contract address not configured. Please set NEXT_PUBLIC_PEER_REVIEW_ESCROW_ADDRESS in .env.local')
    }

    // Initialize contracts
    this.escrowContract = new ethers.Contract(
      PEER_REVIEW_ESCROW_ADDRESS,
      PEER_REVIEW_ESCROW_ABI,
      this.signer
    )

    console.log('Contract initialized at:', PEER_REVIEW_ESCROW_ADDRESS)

    // Get address and ETH balance
    const address = await this.signer.getAddress()
    const balance = await this.provider.getBalance(address)

    return {
      address,
      balance: ethers.formatUnits(balance, 18),
    }
  }

  /**
   * Switch to Celo Sepolia network
   */
  async switchToCeloSepolia(): Promise<void> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CELO_SEPOLIA_CHAIN_ID.toString(16)}` }],
      })
    } catch (switchError: any) {
      // Network not added, add it
      if (switchError.code === 4902 && window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${CELO_SEPOLIA_CHAIN_ID.toString(16)}`,
              chainName: 'Celo Sepolia Testnet',
              nativeCurrency: {
                name: 'CELO',
                symbol: 'CELO',
                decimals: 18,
              },
              rpcUrls: [CELO_SEPOLIA_RPC],
              blockExplorerUrls: ['https://celo-sepolia.blockscout.com', 'https://celoscan.io'],
            },
          ],
        })
      } else {
        throw switchError
      }
    }
  }

  /**
   * Pay for skill verification (0.01 CELO on Celo Sepolia)
   */
  async payForVerification(submissionId: string): Promise<string> {
    if (!this.escrowContract || !this.signer || !this.provider) {
      throw new Error('Not connected. Call connect() first.')
    }

    const amount = ethers.parseEther('0.01') // 0.01 CELO (free testnet)
    const userAddress = await this.signer.getAddress()

    // Check balance
    const balance = await this.provider.getBalance(userAddress)
    if (balance < amount) {
      throw new Error('Insufficient CELO balance. You need 0.01 CELO.')
    }

    // Convert UUID string to uint256 by hashing it
    // This creates a unique number for each submission
    const submissionIdHash = ethers.keccak256(ethers.toUtf8Bytes(submissionId))
    const submissionIdNumber = BigInt(submissionIdHash) % BigInt(2 ** 64) // Use lower 64 bits

    // Pay for verification with native CELO
    console.log('Paying for verification with CELO...')
    console.log('Submission ID:', submissionId)
    console.log('Submission ID Number:', submissionIdNumber.toString())
    
    const tx = await this.escrowContract.payForVerification(submissionIdNumber, {
      value: amount
    })
    const receipt = await tx.wait()

    console.log('Payment confirmed:', receipt.hash)
    return receipt.hash
  }

  /**
   * Complete verification and pay reviewer (called by backend)
   */
  async completeVerification(
    reviewId: string,
    reviewerAddress: string,
    confidenceScore: number
  ): Promise<string> {
    if (!this.escrowContract) {
      throw new Error('Not connected. Call connect() first.')
    }

    const tx = await this.escrowContract.completeVerification(
      reviewId,
      reviewerAddress,
      confidenceScore
    )
    const receipt = await tx.wait()

    return receipt.hash
  }

  /**
   * Get CELO balance
   */
  async getCELOBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Not connected. Call connect() first.')
    }

    const balance = await this.provider.getBalance(address)
    return ethers.formatEther(balance)
  }

  /**
   * Get platform fees collected
   */
  async getPlatformFees(): Promise<string> {
    if (!this.escrowContract) {
      throw new Error('Not connected. Call connect() first.')
    }

    const fees = await this.escrowContract.platformFees()
    return ethers.formatUnits(fees, 18)
  }

  /**
   * Withdraw platform fees (admin only)
   */
  async withdrawPlatformFees(): Promise<string> {
    if (!this.escrowContract) {
      throw new Error('Not connected. Call connect() first.')
    }

    const tx = await this.escrowContract.withdrawPlatformFees()
    const receipt = await tx.wait()

    return receipt.hash
  }

  /**
   * Listen for verification events
   */
  onVerificationCreated(callback: (verificationId: number, reviewer: string, skillOwner: string, skillName: string) => void) {
    if (!this.escrowContract) {
      throw new Error('Not connected. Call connect() first.')
    }

    this.escrowContract.on('VerificationCreated', callback)
  }

  /**
   * Listen for reward paid events
   */
  onRewardPaid(callback: (verificationId: number, reviewer: string, amount: bigint) => void) {
    if (!this.escrowContract) {
      throw new Error('Not connected. Call connect() first.')
    }

    this.escrowContract.on('RewardPaid', callback)
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.escrowContract) {
      this.escrowContract.removeAllListeners()
    }
    this.provider = null
    this.signer = null
    this.escrowContract = null
    this.cusdContract = null
  }
}

// Singleton instance
export const peerReviewEscrowService = new PeerReviewEscrowService()
