import { ethers } from 'ethers'

// Lightweight Escrow ABI
const LIGHTWEIGHT_ESCROW_ABI = [
  "function proposeBarter(address _learner, uint256 _duration) external payable returns (uint256)",
  "function acceptBarter(uint256 _barterId) external payable",
  "function checkIn(uint256 _barterId) external",
  "function completeBarter(uint256 _barterId) external",
  "function raiseDispute(uint256 _barterId) external",
  "function getBarterDetails(uint256 _barterId) external view returns (address, address, uint256, uint256, uint256, uint8, uint8, bool, bool)",
  "function getParticipationRate(uint256 _barterId) external view returns (uint256, uint256)",
  "function canComplete(uint256 _barterId) external view returns (bool)",
  "event BarterProposed(uint256 indexed barterId, address indexed teacher, address indexed learner, uint256 depositAmount)",
  "event BarterAccepted(uint256 indexed barterId, uint256 startDate)",
  "event CheckInRecorded(uint256 indexed barterId, address indexed user, uint8 totalCheckIns)",
  "event BarterCompleted(uint256 indexed barterId, address teacher, address learner)",
  "event DisputeRaised(uint256 indexed barterId, address indexed raiser)"
]

export interface BarterProposal {
  learnerAddress: string
  duration: number // in days
  depositAmount: string // in CELO (e.g., "0.1")
}

export interface BarterDetails {
  id: number
  teacher: string
  learner: string
  depositAmount: string
  startDate: number
  duration: number
  teacherCheckIns: number
  learnerCheckIns: number
  completed: boolean
  disputed: boolean
}

export class LightweightEscrowService {
  private provider: ethers.BrowserProvider | null = null
  private contractAddress: string

  constructor() {
    // Celo Sepolia Testnet
    this.contractAddress = process.env.NEXT_PUBLIC_LIGHTWEIGHT_ESCROW_ADDRESS || ''
  }

  private async getProvider(): Promise<ethers.BrowserProvider> {
    if (this.provider) return this.provider

    if (typeof window === 'undefined') {
      throw new Error('This function can only be called on the client-side')
    }

    if (!window.ethereum) {
      throw new Error('MetaMask not installed')
    }

    // Create provider without network config (let MetaMask handle it)
    // This prevents ENS resolution attempts on Celo Sepolia
    this.provider = new ethers.BrowserProvider(window.ethereum)
    
    return this.provider
  }

  /**
   * Propose a new skill barter with CELO deposit
   */
  async proposeBarter(proposal: BarterProposal): Promise<{ barterId: number; txHash: string }> {
    try {
      const provider = await this.getProvider()
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, LIGHTWEIGHT_ESCROW_ABI, signer)

      // Validate and format learner address (prevent ENS resolution)
      if (!proposal.learnerAddress || !proposal.learnerAddress.startsWith('0x')) {
        throw new Error('Invalid learner address. Must be a valid Ethereum address starting with 0x')
      }

      // Ensure address is properly formatted (checksum)
      const learnerAddress = ethers.getAddress(proposal.learnerAddress)
      
      console.log('🔍 Validated learner address:', learnerAddress)

      // Convert CELO amount to wei
      const depositWei = ethers.parseEther(proposal.depositAmount)

      console.log('💰 Deposit amount (wei):', depositWei.toString())
      console.log('⏱️ Duration:', proposal.duration)
      console.log('📝 Contract address:', this.contractAddress)

      // Get signer address
      const signerAddress = await signer.getAddress()
      console.log('👤 Signer address:', signerAddress)

      // Encode function data manually
      const data = contract.interface.encodeFunctionData('proposeBarter', [
        learnerAddress,
        proposal.duration
      ])

      console.log('📝 Encoded data:', data)

      // Manually construct transaction (bypass all ENS resolution)
      const txRequest = {
        to: this.contractAddress,
        from: signerAddress,
        value: depositWei,
        data: data,
        gasLimit: BigInt(500000) // Explicit gas limit
      }

      console.log('📤 Sending transaction...')
      const tx = await signer.sendTransaction(txRequest)

      console.log('⏳ Waiting for transaction confirmation...')
      const receipt = await tx.wait()
      
      if (!receipt) {
        throw new Error('Transaction receipt is null')
      }
      
      console.log('✅ Transaction confirmed!')
      console.log('📋 Receipt:', receipt)
      console.log('📝 Logs count:', receipt.logs.length)
      
      // Try to extract barterId from event
      let barterId = 0
      
      // Log all events for debugging
      receipt.logs.forEach((log: any, index: number) => {
        try {
          const parsed = contract.interface.parseLog(log)
          console.log(`Event ${index}:`, parsed?.name, parsed?.args)
          
          if (parsed?.name === 'BarterProposed') {
            barterId = Number(parsed.args?.barterId || 0)
          }
        } catch (e) {
          console.log(`Log ${index}: Unable to parse (might be from different contract)`)
        }
      })

      // If no event found, use a placeholder (you'll need to get it from contract state)
      if (barterId === 0) {
        console.warn('⚠️ BarterProposed event not found, using placeholder ID')
        barterId = Date.now() // Temporary - use timestamp as placeholder
      }

      console.log('🎉 Barter ID:', barterId)

      return {
        barterId,
        txHash: receipt.hash
      }
    } catch (error) {
      console.error('Error proposing barter:', error)
      throw error
    }
  }

  /**
   * Accept a barter proposal with matching CELO deposit
   */
  async acceptBarter(barterId: number, depositAmount: string): Promise<string> {
    try {
      const provider = await this.getProvider()
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, LIGHTWEIGHT_ESCROW_ABI, signer)

      // Convert CELO amount to wei
      const depositWei = ethers.parseEther(depositAmount)

      // Accept barter with CELO deposit
      const tx = await contract.acceptBarter(barterId, { value: depositWei })
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error('Error accepting barter:', error)
      throw error
    }
  }

  /**
   * Record daily check-in (very cheap!)
   */
  async checkIn(barterId: number): Promise<string> {
    try {
      const provider = await this.getProvider()
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, LIGHTWEIGHT_ESCROW_ABI, signer)

      const tx = await contract.checkIn(barterId)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error('Error checking in:', error)
      throw error
    }
  }

  /**
   * Complete barter and distribute CELO
   */
  async completeBarter(barterId: number): Promise<string> {
    try {
      const provider = await this.getProvider()
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, LIGHTWEIGHT_ESCROW_ABI, signer)

      const tx = await contract.completeBarter(barterId)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error('Error completing barter:', error)
      throw error
    }
  }

  /**
   * Raise a dispute
   */
  async raiseDispute(barterId: number): Promise<string> {
    try {
      const provider = await this.getProvider()
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, LIGHTWEIGHT_ESCROW_ABI, signer)

      const tx = await contract.raiseDispute(barterId)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error('Error raising dispute:', error)
      throw error
    }
  }

  /**
   * Get barter details
   */
  async getBarterDetails(barterId: number): Promise<BarterDetails> {
    try {
      const provider = await this.getProvider()
      const contract = new ethers.Contract(this.contractAddress, LIGHTWEIGHT_ESCROW_ABI, provider)

      const [teacher, learner, depositAmount, startDate, duration, teacherCheckIns, learnerCheckIns, completed, disputed] = 
        await contract.getBarterDetails(barterId)

      return {
        id: barterId,
        teacher,
        learner,
        depositAmount: ethers.formatEther(depositAmount),
        startDate: Number(startDate),
        duration: Number(duration),
        teacherCheckIns: Number(teacherCheckIns),
        learnerCheckIns: Number(learnerCheckIns),
        completed,
        disputed
      }
    } catch (error) {
      console.error('Error getting barter details:', error)
      throw error
    }
  }

  /**
   * Get participation rate
   */
  async getParticipationRate(barterId: number): Promise<{ teacherRate: number; learnerRate: number }> {
    try {
      const provider = await this.getProvider()
      const contract = new ethers.Contract(this.contractAddress, LIGHTWEIGHT_ESCROW_ABI, provider)

      const [teacherRate, learnerRate] = await contract.getParticipationRate(barterId)

      return {
        teacherRate: Number(teacherRate),
        learnerRate: Number(learnerRate)
      }
    } catch (error) {
      console.error('Error getting participation rate:', error)
      throw error
    }
  }

  /**
   * Check if barter can be completed
   */
  async canComplete(barterId: number): Promise<boolean> {
    try {
      const provider = await this.getProvider()
      const contract = new ethers.Contract(this.contractAddress, LIGHTWEIGHT_ESCROW_ABI, provider)
      return await contract.canComplete(barterId)
    } catch (error) {
      console.error('Error checking completion:', error)
      throw error
    }
  }

  /**
   * Get CELO balance
   */
  async getCELOBalance(address: string): Promise<string> {
    try {
      const provider = await this.getProvider()
      const balance = await provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Error getting CELO balance:', error)
      throw error
    }
  }
}

export const lightweightEscrowService = new LightweightEscrowService()
