import { createKit, getContractAddresses } from './config'
import { ContractKit } from '@celo/contractkit'

export class CeloService {
  private kit: ContractKit

  constructor() {
    this.kit = createKit()
  }

  // Get account balance
  async getBalance(address: string) {
    const balance = await this.kit.getTotalBalance(address)
    return {
      celo: balance.CELO ? this.kit.web3.utils.fromWei(balance.CELO.toString(), 'ether') : '0',
      cUSD: balance.cUSD ? this.kit.web3.utils.fromWei(balance.cUSD.toString(), 'ether') : '0',
    }
  }

  // Attest a skill on-chain
  async attestSkill(params: {
    userAddress: string
    skill: string
    confidence: number
    evidenceIpfs: string
  }) {
    const addresses = getContractAddresses()
    
    if (!addresses.skillsRegistry) {
      throw new Error('SkillsRegistry contract not deployed')
    }

    // This will be implemented after contract deployment
    // For now, return a mock transaction hash
    return {
      txHash: '0x' + Math.random().toString(16).substring(2),
      blockNumber: Math.floor(Math.random() * 1000000),
    }
  }

  // Issue a credential NFT (Portfolio NFT)
  async issueCredential(params: {
    recipientAddress: string
    credentialType: string
    metadataIpfs: string
  }) {
    const portfolioNFTAddress = process.env.NEXT_PUBLIC_PORTFOLIO_NFT_CONTRACT
    
    if (!portfolioNFTAddress) {
      throw new Error('Portfolio NFT contract not configured')
    }

    try {
      const kit = createKit()
      
      // Add private key from env
      const privateKey = process.env.CELO_PRIVATE_KEY
      if (!privateKey) {
        throw new Error('CELO_PRIVATE_KEY not configured')
      }
      
      const formattedKey = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`
      kit.addAccount(formattedKey)
      const account = kit.web3.eth.accounts.privateKeyToAccount(formattedKey as string)
      kit.defaultAccount = account.address as `0x${string}`

      // Portfolio NFT contract ABI (with tokenURI for metadata)
      const abi = [
        {
          "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "string", "name": "encryptedIpfsHash", "type": "string" }
          ],
          "name": "mintPortfolio",
          "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
          "name": "tokenURI",
          "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
          "stateMutability": "view",
          "type": "function"
        }
      ]

      const contract = new kit.web3.eth.Contract(abi as any, portfolioNFTAddress)

      console.log(`📝 Minting NFT to ${params.recipientAddress}...`)
      console.log(`📦 IPFS Hash: ${params.metadataIpfs}`)

      // Mint the NFT
      const tx = await contract.methods
        .mintPortfolio(params.recipientAddress, params.metadataIpfs)
        .send({ from: account.address, gas: 500000 })

      console.log(`✅ NFT minted! TX: ${tx.transactionHash}`)

      // Extract token ID from events
      // Debug: Log all events to see structure
      console.log('📋 Transaction events:', JSON.stringify(tx.events, null, 2))
      
      let tokenId: string | number = 'unknown'
      
      // Try different event structures
      if (tx.events?.PortfolioMinted?.returnValues?.tokenId) {
        tokenId = tx.events.PortfolioMinted.returnValues.tokenId
      } else if (tx.events?.Transfer?.returnValues?.tokenId) {
        tokenId = tx.events.Transfer.returnValues.tokenId
      } else if (tx.events?.Transfer?.returnValues?.[2]) {
        // ERC721 Transfer event: Transfer(from, to, tokenId)
        tokenId = tx.events.Transfer.returnValues[2]
      } else if (tx.events?.[0]?.raw?.topics?.[3]) {
        // Extract from raw topics (last topic is tokenId in Transfer event)
        const hexTokenId = tx.events[0].raw.topics[3]
        tokenId = parseInt(hexTokenId, 16) // Convert hex to decimal
        console.log(`🎫 Extracted token ID from raw topics: ${hexTokenId} → ${tokenId}`)
      }
      
      console.log(`🎫 Final token ID: ${tokenId}`)

      return {
        txHash: tx.transactionHash,
        tokenId: tokenId === 'unknown' ? null : (typeof tokenId === 'string' ? parseInt(tokenId) : tokenId),
      }
    } catch (error: any) {
      console.error('Error minting NFT:', error)
      throw new Error(`Failed to mint NFT: ${error.message}`)
    }
  }

  // Verify a credential
  async verifyCredential(tokenId: number) {
    const addresses = getContractAddresses()
    
    if (!addresses.credentialIssuer) {
      throw new Error('CredentialIssuer contract not deployed')
    }

    // This will be implemented after contract deployment
    return {
      valid: true,
      owner: '0x0000000000000000000000000000000000000000',
      metadataIpfs: '',
      issuedAt: Date.now(),
    }
  }

  // Get user's skills from blockchain
  async getUserSkills(address: string) {
    const addresses = getContractAddresses()
    
    if (!addresses.skillsRegistry) {
      throw new Error('SkillsRegistry contract not deployed')
    }

    // This will be implemented after contract deployment
    return []
  }
}

export const celoService = new CeloService()
