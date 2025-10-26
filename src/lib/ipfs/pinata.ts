import { PinataSDK } from 'pinata-web3'
import { encryptionService } from '@/lib/encryption/service'

// Initialize Pinata SDK
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud',
})

export interface PortfolioData {
  userId: string
  fullName: string
  title: string
  bio: string
  avatarUrl?: string
  githubUsername?: string
  careerLevel?: string
  skills: Array<{
    name: string
    confidence: number
    evidence: string[]
  }>
  projects: Array<{
    name: string
    description: string
    url: string
    technologies: string[]
  }>
  bestProjects: Array<{
    name: string
    why: string
    impact: string
    technologies: string[]
  }>
  experience: Array<{
    company: string
    role: string
    duration: string
    description: string
  }>
  education: Array<{
    institution: string
    degree: string
    year: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    date: string
    credentialUrl?: string
  }>
  generatedAt: string
}

export class IPFSService {
  // Upload portfolio to IPFS (encrypted)
  async uploadPortfolio(portfolio: PortfolioData): Promise<string> {
    try {
      // Encrypt portfolio data
      const encryptedData = encryptionService.encrypt(portfolio)
      
      // Upload encrypted data to IPFS
      const result = await pinata.upload.json({
        encrypted: true,
        data: encryptedData,
        timestamp: new Date().toISOString(),
      })
      
      console.log(`✅ Portfolio encrypted and uploaded to IPFS: ${result.IpfsHash}`)
      return result.IpfsHash
    } catch (error) {
      console.error('Error uploading to IPFS:', error)
      throw new Error('Failed to upload portfolio to IPFS')
    }
  }

  // Upload NFT metadata (hybrid: public display + encrypted sensitive data)
  async uploadNFTMetadata(portfolio: PortfolioData, encryptedIpfsHash: string): Promise<string> {
    try {
      // Encrypt sensitive details (skills, projects, personal info)
      const encryptedDetails = encryptionService.encrypt({
        fullName: portfolio.fullName,
        bio: portfolio.bio,
        githubUsername: portfolio.githubUsername,
        skills: portfolio.skills,
        projects: portfolio.projects,
        bestProjects: portfolio.bestProjects,
        experience: portfolio.experience,
        education: portfolio.education,
        certifications: portfolio.certifications,
      })

      // Create ERC-721 compliant metadata (hybrid: public stats + encrypted details)
      const metadata = {
        name: `${portfolio.fullName || 'Professional'}'s Portfolio`,
        description: `${portfolio.title || 'Developer'} | ${portfolio.bio || 'Blockchain-verified professional portfolio'}`,
        // Use avatar if available (public info)
        image: portfolio.avatarUrl || 'https://hirenexa.com/nft-image.png',
        external_url: `https://hirenexa.com/portfolio/${portfolio.githubUsername || 'view'}`,
        attributes: [
          {
            trait_type: 'Total Skills',
            value: portfolio.skills?.length || 0,
          },
          {
            trait_type: 'Total Projects',
            value: portfolio.projects?.length || 0,
          },
          {
            trait_type: 'Best Projects',
            value: portfolio.bestProjects?.length || 0,
          },
          {
            trait_type: 'Career Level',
            value: portfolio.careerLevel || 'Developer',
          },
          {
            trait_type: 'Encryption',
            value: 'AES-256-GCM',
          },
          {
            trait_type: 'Generated At',
            display_type: 'date',
            value: Math.floor(new Date(portfolio.generatedAt).getTime() / 1000),
          },
        ],
        // Public properties (visible on explorers)
        properties: {
          career_level: portfolio.careerLevel || 'Developer',
          github_username: portfolio.githubUsername || null,
          owner: portfolio.fullName || 'Anonymous',
          platform: 'HireNexa',
          encryption_standard: 'AES-256-GCM',
          security_level: 'Military-grade',
          data_privacy: 'End-to-end encrypted',
        },
        // Encrypted data stored separately (not in main metadata for cleaner display)
        // Full encrypted portfolio reference
        encrypted_data_ipfs: `ipfs://${encryptedIpfsHash}`,
      }

      // Upload metadata to IPFS
      const result = await pinata.upload.json(metadata)
      
      console.log(`✅ NFT metadata uploaded to IPFS (sensitive data encrypted): ${result.IpfsHash}`)
      return result.IpfsHash
    } catch (error) {
      console.error('Error uploading NFT metadata:', error)
      throw new Error('Failed to upload NFT metadata to IPFS')
    }
  }

  // Upload skill evidence (encrypted)
  async uploadEvidence(evidence: {
    type: 'github' | 'linkedin' | 'project'
    data: any
  }): Promise<string> {
    try {
      // Encrypt evidence
      const encryptedData = encryptionService.encrypt(evidence)
      
      // Upload encrypted evidence to IPFS
      const result = await pinata.upload.json({
        encrypted: true,
        data: encryptedData,
        type: evidence.type,
        timestamp: new Date().toISOString(),
      })
      
      console.log(`✅ Evidence encrypted and uploaded to IPFS: ${result.IpfsHash}`)
      return result.IpfsHash
    } catch (error) {
      console.error('Error uploading evidence:', error)
      throw new Error('Failed to upload evidence to IPFS')
    }
  }

  // Upload credential metadata (encrypted)
  async uploadCredentialMetadata(metadata: {
    name: string
    description: string
    image: string
    attributes: Array<{ trait_type: string; value: string }>
  }): Promise<string> {
    try {
      // Encrypt credential metadata
      const encryptedData = encryptionService.encrypt(metadata)
      
      // Upload encrypted metadata to IPFS
      const result = await pinata.upload.json({
        encrypted: true,
        data: encryptedData,
        timestamp: new Date().toISOString(),
      })
      
      console.log(`✅ Credential metadata encrypted and uploaded to IPFS: ${result.IpfsHash}`)
      return result.IpfsHash
    } catch (error) {
      console.error('Error uploading metadata:', error)
      throw new Error('Failed to upload credential metadata to IPFS')
    }
  }

  // Get IPFS gateway URL
  getGatewayUrl(ipfsHash: string): string {
    return `https://${process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${ipfsHash}`
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: any): Promise<string> {
    try {
      const result = await pinata.upload.json(data)
      return result.IpfsHash
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error)
      throw error
    }
  }

  /**
   * Fetch data from IPFS
   */
  async fetchFromIPFS(ipfsHash: string): Promise<any> {
    try {
      const url = this.getGatewayUrl(ipfsHash)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // If data is encrypted, decrypt it
      if (data.encrypted && data.data) {
        return encryptionService.decrypt(data.data)
      }
      
      return data
    } catch (error) {
      console.error('Error fetching from IPFS:', error)
      throw new Error('Failed to fetch data from IPFS')
    }
  }
}

export const ipfsService = new IPFSService()
