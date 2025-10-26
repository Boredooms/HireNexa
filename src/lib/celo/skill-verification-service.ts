/**
 * Skill Verification Service
 * Interacts with SkillVerification smart contract on Celo
 */

import { ethers, Contract } from 'ethers'

// SkillVerification ABI
const SkillVerificationABI = [
  'function createSkill(string skillName, uint8 confidenceScore, string evidenceIpfs) external returns (bytes32)',
  'function verifySkill(bytes32 skillId, bool approved, uint8 confidenceScore, string notes) external',
  'function getSkill(bytes32 skillId) external view returns (address user, string skillName, uint8 confidenceScore, string evidenceIpfs, uint256 createdAt, uint256 expiresAt, bool revoked, uint8 verificationsCount, uint8 requiredVerificationsCount)',
  'function getVerifications(bytes32 skillId) external view returns (tuple(address verifier, bool approved, uint8 confidenceScore, string notes, uint256 timestamp, bool paid)[])',
  'function getUserSkills(address user) external view returns (bytes32[])',
  'function getVerifier(address verifier) external view returns (uint256 totalVerifications, uint256 successfulVerifications, uint256 disputedVerifications, uint256 reputationScore, uint256 totalEarned, bool isAuthorized, bool isSuspended)',
  'function isSkillFullyVerified(bytes32 skillId) external view returns (bool)',
  'function registerAsVerifier() external',
  'function revokeSkill(bytes32 skillId, string reason) external',
  'function raiseDispute(bytes32 skillId, string reason) external',
  'function withdrawEarnings() external',
  'event SkillCreated(bytes32 indexed skillId, address indexed user, string skillName, uint8 confidenceScore)',
  'event SkillVerified(bytes32 indexed skillId, address indexed verifier, bool approved, uint8 confidenceScore)',
  'event SkillFullyVerified(bytes32 indexed skillId, address indexed user, uint8 finalConfidenceScore)'
]

const SKILL_VERIFICATION_ADDRESS = process.env.NEXT_PUBLIC_SKILL_VERIFICATION_SEPOLIA || '0x0000000000000000000000000000000000000000'

export interface SkillData {
  skillName: string
  confidenceScore: number
  evidenceIpfs: string
}

export interface VerificationData {
  skillId: string
  approved: boolean
  confidenceScore: number
  notes: string
}

export class SkillVerificationService {
  private provider: ethers.JsonRpcProvider
  private contract: Contract

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
    )
    this.contract = new ethers.Contract(
      SKILL_VERIFICATION_ADDRESS,
      SkillVerificationABI,
      this.provider
    ) as Contract
  }

  /**
   * Create a new skill for verification
   */
  async createSkill(skillData: SkillData, signer: ethers.Signer): Promise<{
    skillId: string
    txHash: string
  }> {
    const contract = this.contract.connect(signer)

    const tx = await (contract as any).createSkill(
      skillData.skillName,
      skillData.confidenceScore,
      skillData.evidenceIpfs
    )

    const receipt = await tx.wait()

    // Extract skillId from SkillCreated event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed?.name === 'SkillCreated'
      } catch {
        return false
      }
    })

    const skillId = event ? contract.interface.parseLog(event)?.args?.skillId || '0x0' : '0x0'

    return {
      skillId,
      txHash: receipt.hash,
    }
  }

  /**
   * Verify a skill (peer review)
   */
  async verifySkill(
    verificationData: VerificationData,
    signer: ethers.Signer
  ): Promise<string> {
    const contract = this.contract.connect(signer)

    const tx = await (contract as any).verifySkill(
      verificationData.skillId,
      verificationData.approved,
      verificationData.confidenceScore,
      verificationData.notes
    )

    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Get skill details
   */
  async getSkill(skillId: string): Promise<{
    user: string
    skillName: string
    confidenceScore: number
    evidenceIpfs: string
    createdAt: number
    expiresAt: number
    revoked: boolean
    verificationsCount: number
    requiredVerifications: number
  }> {
    const skill = await (this.contract as any).getSkill(skillId)

    return {
      user: skill.user,
      skillName: skill.skillName,
      confidenceScore: Number(skill.confidenceScore),
      evidenceIpfs: skill.evidenceIpfs,
      createdAt: Number(skill.createdAt),
      expiresAt: Number(skill.expiresAt),
      revoked: skill.revoked,
      verificationsCount: Number(skill.verificationsCount),
      requiredVerifications: Number(skill.requiredVerifications),
    }
  }

  /**
   * Get all verifications for a skill
   */
  async getVerifications(skillId: string): Promise<
    Array<{
      verifier: string
      approved: boolean
      confidenceScore: number
      notes: string
      timestamp: number
      paid: boolean
    }>
  > {
    const verifications = await (this.contract as any).getVerifications(skillId)

    return verifications.map((v: any) => ({
      verifier: v.verifier,
      approved: v.approved,
      confidenceScore: Number(v.confidenceScore),
      notes: v.notes,
      timestamp: Number(v.timestamp),
      paid: v.paid,
    }))
  }

  /**
   * Get user's skills
   */
  async getUserSkills(userAddress: string): Promise<string[]> {
    return await (this.contract as any).getUserSkills(userAddress)
  }

  /**
   * Get verifier details
   */
  async getVerifier(verifierAddress: string): Promise<{
    totalVerifications: number
    successfulVerifications: number
    disputedVerifications: number
    reputationScore: number
    totalEarned: string
    isAuthorized: boolean
    isSuspended: boolean
  }> {
    const verifier = await (this.contract as any).getVerifier(verifierAddress)

    return {
      totalVerifications: Number(verifier.totalVerifications),
      successfulVerifications: Number(verifier.successfulVerifications),
      disputedVerifications: Number(verifier.disputedVerifications),
      reputationScore: Number(verifier.reputationScore),
      totalEarned: ethers.formatEther(verifier.totalEarned),
      isAuthorized: verifier.isAuthorized,
      isSuspended: verifier.isSuspended,
    }
  }

  /**
   * Check if skill is fully verified
   */
  async isSkillFullyVerified(skillId: string): Promise<boolean> {
    return await (this.contract as any).isSkillFullyVerified(skillId)
  }

  /**
   * Register as a verifier
   */
  async registerAsVerifier(signer: ethers.Signer): Promise<string> {
    const contract = this.contract.connect(signer)
    const tx = await (contract as any).registerAsVerifier()
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Revoke a skill
   */
  async revokeSkill(skillId: string, reason: string, signer: ethers.Signer): Promise<string> {
    const contract = this.contract.connect(signer)
    const tx = await (contract as any).revokeSkill(skillId, reason)
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Raise a dispute
   */
  async raiseDispute(skillId: string, reason: string, signer: ethers.Signer): Promise<string> {
    const contract = this.contract.connect(signer)
    const tx = await (contract as any).raiseDispute(skillId, reason)
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Withdraw earnings (verifier only)
   */
  async withdrawEarnings(signer: ethers.Signer): Promise<string> {
    const contract = this.contract.connect(signer)
    const tx = await (contract as any).withdrawEarnings()
    const receipt = await tx.wait()
    return receipt.hash
  }

  /**
   * Listen to skill created events
   */
  onSkillCreated(callback: (skillId: string, user: string, skillName: string) => void) {
    this.contract.on('SkillCreated', (skillId, user, skillName) => {
      callback(skillId, user, skillName)
    })
  }

  /**
   * Listen to skill verified events
   */
  onSkillVerified(
    callback: (skillId: string, verifier: string, approved: boolean) => void
  ) {
    this.contract.on('SkillVerified', (skillId, verifier, approved) => {
      callback(skillId, verifier, approved)
    })
  }

  /**
   * Listen to skill fully verified events
   */
  onSkillFullyVerified(callback: (skillId: string, user: string) => void) {
    this.contract.on('SkillFullyVerified', (skillId, user) => {
      callback(skillId, user)
    })
  }

  /**
   * Stop listening to events
   */
  removeAllListeners() {
    this.contract.removeAllListeners()
  }
}

export const skillVerificationService = new SkillVerificationService()
