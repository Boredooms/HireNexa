import { ethers } from 'ethers'

// Smart Contract ABI
const SKILL_BARTER_ESCROW_ABI = [
  "function proposeBarter(address _learner, string _skillOffered, string _skillRequested, uint256 _duration, uint256 _teacherDeposit, uint256 _learnerDeposit, string[] _milestoneDescriptions, uint256[] _milestoneDueDates) external returns (uint256)",
  "function acceptBarter(uint256 _barterId) external",
  "function recordDailyCheckIn(uint256 _barterId, string _note, uint256 _rating) external",
  "function submitMilestoneProof(uint256 _barterId, uint256 _milestoneIndex, string _proofHash) external",
  "function completeBarter(uint256 _barterId) external",
  "function withdrawTokens(uint256 _barterId) external",
  "function raiseDispute(uint256 _barterId) external",
  "function getBarterDetails(uint256 _barterId) external view returns (address, address, string, string, uint256, uint8, uint256, uint256)",
  "function getMilestone(uint256 _barterId, uint256 _index) external view returns (string, uint256, bool, bool, bool)",
  "function getDailyCheckIn(uint256 _barterId, uint256 _day) external view returns (bool, bool, string, string, uint256, uint256)",
  "function getParticipationRate(uint256 _barterId) external view returns (uint256, uint256)",
  "event BarterProposed(uint256 indexed barterId, address indexed teacher, address indexed learner)",
  "event BarterAccepted(uint256 indexed barterId, uint256 startDate)",
  "event MilestoneCompleted(uint256 indexed barterId, uint256 milestoneIndex)",
  "event DailyCheckInRecorded(uint256 indexed barterId, uint256 day, address indexed user)",
  "event BarterCompleted(uint256 indexed barterId, uint256 nftTokenId)",
  "event DisputeRaised(uint256 indexed barterId, address indexed raiser)"
]

const CUSD_TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)"
]

export interface BarterProposal {
  learnerAddress: string
  skillOffered: string
  skillRequested: string
  duration: number // in days
  teacherDeposit: string // in cUSD
  learnerDeposit: string // in cUSD
  milestones: {
    description: string
    dueDate: number // timestamp
  }[]
}

export interface BarterDetails {
  id: number
  teacher: string
  learner: string
  skillOffered: string
  skillRequested: string
  duration: number
  status: 'Proposed' | 'Active' | 'Completed' | 'Disputed' | 'Cancelled'
  completedMilestones: number
  totalMilestones: number
}

export interface DailyCheckIn {
  teacherCheckedIn: boolean
  learnerCheckedIn: boolean
  teacherNote: string
  learnerNote: string
  teacherRating: number
  learnerRating: number
}

export class SkillBarterEscrowService {
  private provider: ethers.BrowserProvider
  private contractAddress: string
  private cUSDAddress: string

  constructor() {
    // Celo Sepolia Testnet
    this.contractAddress = process.env.NEXT_PUBLIC_SKILL_BARTER_ESCROW_ADDRESS || ''
    this.cUSDAddress = process.env.NEXT_PUBLIC_CUSD_ADDRESS || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' // Celo Sepolia cUSD
    
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum)
    } else {
      throw new Error('MetaMask not installed')
    }
  }

  /**
   * Propose a new skill barter with escrow
   */
  async proposeBarter(proposal: BarterProposal): Promise<{ barterId: number; txHash: string }> {
    try {
      const signer = await this.provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, SKILL_BARTER_ESCROW_ABI, signer)

      // Convert deposits to wei (cUSD has 18 decimals)
      const teacherDepositWei = ethers.parseUnits(proposal.teacherDeposit, 18)
      const learnerDepositWei = ethers.parseUnits(proposal.learnerDeposit, 18)

      // Prepare milestone arrays
      const milestoneDescriptions = proposal.milestones.map(m => m.description)
      const milestoneDueDates = proposal.milestones.map(m => m.dueDate)

      // Approve cUSD spending first
      await this.approveCUSD(proposal.teacherDeposit)

      // Propose barter
      const tx = await contract.proposeBarter(
        proposal.learnerAddress,
        proposal.skillOffered,
        proposal.skillRequested,
        proposal.duration,
        teacherDepositWei,
        learnerDepositWei,
        milestoneDescriptions,
        milestoneDueDates
      )

      const receipt = await tx.wait()
      
      // Extract barterId from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'BarterProposed'
        } catch {
          return false
        }
      })

      const parsedEvent = contract.interface.parseLog(event)
      const barterId = Number(parsedEvent?.args?.barterId || 0)

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
   * Accept a barter proposal
   */
  async acceptBarter(barterId: number, depositAmount: string): Promise<string> {
    try {
      const signer = await this.provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, SKILL_BARTER_ESCROW_ABI, signer)

      // Approve cUSD spending
      await this.approveCUSD(depositAmount)

      // Accept barter
      const tx = await contract.acceptBarter(barterId)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error('Error accepting barter:', error)
      throw error
    }
  }

  /**
   * Record daily check-in
   */
  async recordDailyCheckIn(barterId: number, note: string, rating: number): Promise<string> {
    try {
      const signer = await this.provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, SKILL_BARTER_ESCROW_ABI, signer)

      const tx = await contract.recordDailyCheckIn(barterId, note, rating)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error('Error recording check-in:', error)
      throw error
    }
  }

  /**
   * Submit milestone proof
   */
  async submitMilestoneProof(barterId: number, milestoneIndex: number, proofHash: string): Promise<string> {
    try {
      const signer = await this.provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, SKILL_BARTER_ESCROW_ABI, signer)

      const tx = await contract.submitMilestoneProof(barterId, milestoneIndex, proofHash)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error('Error submitting milestone proof:', error)
      throw error
    }
  }

  /**
   * Complete barter and mint NFT
   */
  async completeBarter(barterId: number): Promise<{ txHash: string; nftTokenId?: number }> {
    try {
      const signer = await this.provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, SKILL_BARTER_ESCROW_ABI, signer)

      const tx = await contract.completeBarter(barterId)
      const receipt = await tx.wait()

      // Extract NFT token ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'BarterCompleted'
        } catch {
          return false
        }
      })

      let nftTokenId
      if (event) {
        const parsedEvent = contract.interface.parseLog(event)
        nftTokenId = Number(parsedEvent?.args?.nftTokenId || 0)
      }

      return {
        txHash: receipt.hash,
        nftTokenId
      }
    } catch (error) {
      console.error('Error completing barter:', error)
      throw error
    }
  }

  /**
   * Withdraw tokens after completion
   */
  async withdrawTokens(barterId: number): Promise<string> {
    try {
      const signer = await this.provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, SKILL_BARTER_ESCROW_ABI, signer)

      const tx = await contract.withdrawTokens(barterId)
      const receipt = await tx.wait()

      return receipt.hash
    } catch (error) {
      console.error('Error withdrawing tokens:', error)
      throw error
    }
  }

  /**
   * Raise a dispute
   */
  async raiseDispute(barterId: number): Promise<string> {
    try {
      const signer = await this.provider.getSigner()
      const contract = new ethers.Contract(this.contractAddress, SKILL_BARTER_ESCROW_ABI, signer)

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
      const contract = new ethers.Contract(this.contractAddress, SKILL_BARTER_ESCROW_ABI, this.provider)

      const [teacher, learner, skillOffered, skillRequested, duration, status, completedMilestones, totalMilestones] = 
        await contract.getBarterDetails(barterId)

      const statusMap = ['Proposed', 'Active', 'Completed', 'Disputed', 'Cancelled']

      return {
        id: barterId,
        teacher,
        learner,
        skillOffered,
        skillRequested,
        duration: Number(duration),
        status: statusMap[status] as any,
        completedMilestones: Number(completedMilestones),
        totalMilestones: Number(totalMilestones)
      }
    } catch (error) {
      console.error('Error getting barter details:', error)
      throw error
    }
  }

  /**
   * Get daily check-in
   */
  async getDailyCheckIn(barterId: number, day: number): Promise<DailyCheckIn> {
    try {
      const contract = new ethers.Contract(this.contractAddress, SKILL_BARTER_ESCROW_ABI, this.provider)

      const [teacherCheckedIn, learnerCheckedIn, teacherNote, learnerNote, teacherRating, learnerRating] = 
        await contract.getDailyCheckIn(barterId, day)

      return {
        teacherCheckedIn,
        learnerCheckedIn,
        teacherNote,
        learnerNote,
        teacherRating: Number(teacherRating),
        learnerRating: Number(learnerRating)
      }
    } catch (error) {
      console.error('Error getting daily check-in:', error)
      throw error
    }
  }

  /**
   * Get participation rate
   */
  async getParticipationRate(barterId: number): Promise<{ teacherRate: number; learnerRate: number }> {
    try {
      const contract = new ethers.Contract(this.contractAddress, SKILL_BARTER_ESCROW_ABI, this.provider)

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
   * Approve cUSD spending
   */
  private async approveCUSD(amount: string): Promise<void> {
    try {
      const signer = await this.provider.getSigner()
      const cUSDContract = new ethers.Contract(this.cUSDAddress, CUSD_TOKEN_ABI, signer)

      const amountWei = ethers.parseUnits(amount, 18)
      
      // Check current allowance
      const currentAllowance = await cUSDContract.allowance(
        await signer.getAddress(),
        this.contractAddress
      )

      // Only approve if needed
      if (currentAllowance < amountWei) {
        const tx = await cUSDContract.approve(this.contractAddress, amountWei)
        await tx.wait()
      }
    } catch (error) {
      console.error('Error approving cUSD:', error)
      throw error
    }
  }

  /**
   * Get cUSD balance
   */
  async getCUSDBalance(address: string): Promise<string> {
    try {
      const cUSDContract = new ethers.Contract(this.cUSDAddress, CUSD_TOKEN_ABI, this.provider)
      const balance = await cUSDContract.balanceOf(address)
      return ethers.formatUnits(balance, 18)
    } catch (error) {
      console.error('Error getting cUSD balance:', error)
      throw error
    }
  }
}

export const skillBarterEscrowService = new SkillBarterEscrowService()
