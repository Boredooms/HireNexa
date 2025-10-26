/**
 * Job Marketplace Service
 * Interacts with JobMarketplace smart contract on Celo
 */

import { ethers, Contract } from 'ethers'

// JobMarketplace ABI - will be generated after deployment
const JobMarketplaceABI = [
  'function postJob(string title, string descriptionIpfs, string[] requiredSkills, uint8[] requiredSkillLevels, uint256 salaryMin, uint256 salaryMax, uint256 escrowAmount) external returns (uint256)',
  'function applyForJob(uint256 jobId, string coverLetterIpfs, string resumeIpfs, uint8 aiMatchScore, uint256 expectedSalary) external returns (uint256)',
  'function getJob(uint256 jobId) external view returns (address employer, string title, string descriptionIpfs, string[] requiredSkills, uint256 salaryMin, uint256 salaryMax, uint256 escrowAmount, uint8 status, uint256 applicationsCount)',
  'function getApplication(uint256 applicationId) external view returns (uint256 jobId, address candidate, string coverLetterIpfs, string resumeIpfs, uint8 aiMatchScore, uint8 status, uint256 appliedAt)',
  'function getEmployerJobs(address employer) external view returns (uint256[])',
  'function getCandidateApplications(address candidate) external view returns (uint256[])',
  'function getJobApplications(uint256 jobId) external view returns (uint256[])',
  'function updateApplicationStatus(uint256 applicationId, uint8 newStatus) external',
  'function hireCandidate(uint256 applicationId) external',
  'function releaseFullPayment(uint256 jobId) external',
  'function addMilestones(uint256 jobId, string[] descriptions, uint256[] amounts) external',
  'function completeMilestone(uint256 jobId, uint256 milestoneIndex) external',
  'function releaseMilestonePayment(uint256 jobId, uint256 milestoneIndex) external',
  'function raiseDispute(uint256 jobId, string reason) external',
  'event JobPosted(uint256 indexed jobId, address indexed employer, string title, uint256 escrowAmount)',
  'event ApplicationSubmitted(uint256 indexed applicationId, uint256 indexed jobId, address indexed candidate, uint8 aiMatchScore)',
  'event CandidateHired(uint256 indexed jobId, address indexed candidate, uint256 indexed applicationId)'
]

const JOB_MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_JOB_MARKETPLACE_SEPOLIA || '0x0000000000000000000000000000000000000000'
const CUSD_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CUSD_TOKEN_SEPOLIA || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'

export interface JobData {
  title: string
  descriptionIpfs: string
  requiredSkills: string[]
  requiredSkillLevels: number[]
  salaryMin: number
  salaryMax: number
  escrowAmount: number
}

export interface ApplicationData {
  jobId: number
  coverLetterIpfs: string
  resumeIpfs: string
  aiMatchScore: number
  expectedSalary: number
}

export class JobMarketplaceService {
  private provider: ethers.JsonRpcProvider
  private contract: Contract

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
    )
    this.contract = new ethers.Contract(
      JOB_MARKETPLACE_ADDRESS,
      JobMarketplaceABI,
      this.provider
    ) as Contract
  }

  /**
   * Post a new job (requires wallet signature)
   */
  async postJob(jobData: JobData, signer: ethers.Signer): Promise<{
    jobId: number
    txHash: string
  }> {
    const contract = this.contract.connect(signer)

    // Convert amounts to wei (cUSD has 18 decimals)
    const escrowAmountWei = ethers.parseEther(jobData.escrowAmount.toString())
    const salaryMinWei = ethers.parseEther(jobData.salaryMin.toString())
    const salaryMaxWei = ethers.parseEther(jobData.salaryMax.toString())

    const tx = await (contract as any).postJob(
      jobData.title,
      jobData.descriptionIpfs,
      jobData.requiredSkills,
      jobData.requiredSkillLevels,
      salaryMinWei,
      salaryMaxWei,
      escrowAmountWei
    )

    const receipt = await tx.wait()

    // Extract jobId from JobPosted event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed?.name === 'JobPosted'
      } catch {
        return false
      }
    })

    const jobId = event ? Number(contract.interface.parseLog(event)?.args?.jobId || 0) : 0

    return {
      jobId,
      txHash: receipt.hash,
    }
  }

  /**
   * Apply for a job
   */
  async applyForJob(
    applicationData: ApplicationData,
    signer: ethers.Signer
  ): Promise<{
    applicationId: number
    txHash: string
  }> {
    const contract = this.contract.connect(signer)

    const expectedSalaryWei = ethers.parseEther(applicationData.expectedSalary.toString())

    const tx = await (contract as any).applyForJob(
      applicationData.jobId,
      applicationData.coverLetterIpfs,
      applicationData.resumeIpfs,
      applicationData.aiMatchScore,
      expectedSalaryWei
    )

    const receipt = await tx.wait()

    // Extract applicationId from ApplicationSubmitted event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed?.name === 'ApplicationSubmitted'
      } catch {
        return false
      }
    })

    const applicationId = event
      ? Number(contract.interface.parseLog(event)?.args?.applicationId || 0)
      : 0

    return {
      applicationId,
      txHash: receipt.hash,
    }
  }

  /**
   * Get job details
   */
  async getJob(jobId: number): Promise<{
    employer: string
    title: string
    descriptionIpfs: string
    requiredSkills: string[]
    salaryMin: string
    salaryMax: string
    escrowAmount: string
    status: number
    applicationsCount: number
  }> {
    const job = await (this.contract as any).getJob(jobId)

    return {
      employer: job.employer,
      title: job.title,
      descriptionIpfs: job.descriptionIpfs,
      requiredSkills: job.requiredSkills,
      salaryMin: ethers.formatEther(job.salaryMin),
      salaryMax: ethers.formatEther(job.salaryMax),
      escrowAmount: ethers.formatEther(job.escrowAmount),
      status: Number(job.status),
      applicationsCount: Number(job.applicationsCount),
    }
  }

  /**
   * Get application details
   */
  async getApplication(applicationId: number): Promise<{
    jobId: number
    candidate: string
    coverLetterIpfs: string
    resumeIpfs: string
    aiMatchScore: number
    status: number
    appliedAt: number
  }> {
    const app = await (this.contract as any).getApplication(applicationId)

    return {
      jobId: Number(app.jobId),
      candidate: app.candidate,
      coverLetterIpfs: app.coverLetterIpfs,
      resumeIpfs: app.resumeIpfs,
      aiMatchScore: Number(app.aiMatchScore),
      status: Number(app.status),
      appliedAt: Number(app.appliedAt),
    }
  }

  /**
   * Get employer's jobs
   */
  async getEmployerJobs(employerAddress: string): Promise<number[]> {
    const jobIds = await (this.contract as any).getEmployerJobs(employerAddress)
    return jobIds.map((id: bigint) => Number(id))
  }

  /**
   * Get candidate's applications
   */
  async getCandidateApplications(candidateAddress: string): Promise<number[]> {
    const appIds = await (this.contract as any).getCandidateApplications(candidateAddress)
    return appIds.map((id: bigint) => Number(id))
  }

  /**
   * Get job applications
   */
  async getJobApplications(jobId: number): Promise<number[]> {
    const appIds = await (this.contract as any).getJobApplications(jobId)
    return appIds.map((id: bigint) => Number(id))
  }

  /**
   * Update application status (employer or candidate)
   */
  async updateApplicationStatus(
    applicationId: number,
    newStatus: number,
    signer: ethers.Signer
  ): Promise<string> {
    const contract = this.contract.connect(signer)
    const tx = await (contract as any).updateApplicationStatus(applicationId, newStatus)
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Hire a candidate
   */
  async hireCandidate(applicationId: number, signer: ethers.Signer): Promise<string> {
    const contract = this.contract.connect(signer)
    const tx = await (contract as any).hireCandidate(applicationId)
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Release full payment to candidate
   */
  async releaseFullPayment(jobId: number, signer: ethers.Signer): Promise<string> {
    const contract = this.contract.connect(signer)
    const tx = await (contract as any).releaseFullPayment(jobId)
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Add milestones to a job
   */
  async addMilestones(
    jobId: number,
    descriptions: string[],
    amounts: number[],
    signer: ethers.Signer
  ): Promise<string> {
    const contract = this.contract.connect(signer)

    const amountsWei = amounts.map((amount) => ethers.parseEther(amount.toString()))

    const tx = await (contract as any).addMilestones(jobId, descriptions, amountsWei)
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Complete a milestone
   */
  async completeMilestone(
    jobId: number,
    milestoneIndex: number,
    signer: ethers.Signer
  ): Promise<string> {
    const contract = this.contract.connect(signer)
    const tx = await (contract as any).completeMilestone(jobId, milestoneIndex)
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Release milestone payment
   */
  async releaseMilestonePayment(
    jobId: number,
    milestoneIndex: number,
    signer: ethers.Signer
  ): Promise<string> {
    const contract = this.contract.connect(signer)
    const tx = await (contract as any).releaseMilestonePayment(jobId, milestoneIndex)
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Raise a dispute
   */
  async raiseDispute(jobId: number, reason: string, signer: ethers.Signer): Promise<string> {
    const contract = this.contract.connect(signer)
    const tx = await (contract as any).raiseDispute(jobId, reason)
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Listen to job posted events
   */
  onJobPosted(callback: (jobId: number, employer: string, title: string) => void) {
    this.contract.on('JobPosted', (jobId, employer, title) => {
      callback(Number(jobId), employer, title)
    })
  }

  /**
   * Listen to application submitted events
   */
  onApplicationSubmitted(
    callback: (applicationId: number, jobId: number, candidate: string) => void
  ) {
    this.contract.on('ApplicationSubmitted', (applicationId, jobId, candidate) => {
      callback(Number(applicationId), Number(jobId), candidate)
    })
  }

  /**
   * Listen to candidate hired events
   */
  onCandidateHired(callback: (jobId: number, candidate: string) => void) {
    this.contract.on('CandidateHired', (jobId, candidate) => {
      callback(Number(jobId), candidate)
    })
  }

  /**
   * Stop listening to events
   */
  removeAllListeners() {
    this.contract.removeAllListeners()
  }
}

export const jobMarketplaceService = new JobMarketplaceService()
