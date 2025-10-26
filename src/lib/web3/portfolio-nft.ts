import { ethers } from 'ethers'
import { encryptionService } from '@/lib/encryption/service'

// ABI for UpdatablePortfolioNFT contract
const PORTFOLIO_NFT_ABI = [
  'function mintPortfolio(address to, string memory encryptedIpfsHash) public returns (uint256)',
  'function updatePortfolio(uint256 tokenId, string memory newEncryptedIpfsHash) public',
  'function grantSharingPermission(uint256 tokenId, address sharedWith, uint256 duration, string memory encryptedKey) public',
  'function revokeSharingPermission(uint256 tokenId, address revokeFrom) public',
  'function canViewPortfolio(uint256 tokenId, address viewer) public view returns (bool, string memory)',
  'function getPortfolio(uint256 tokenId) public view returns (string, uint256, uint256, address, bool, uint256)',
  'function getPortfoliosByOwner(address owner) public view returns (uint256[])',
  'function canUpdatePortfolio(uint256 tokenId) public view returns (bool, uint256)',
  'event PortfolioMinted(uint256 indexed tokenId, address indexed owner, string encryptedIpfsHash, uint256 timestamp)',
  'event PortfolioUpdated(uint256 indexed tokenId, string newEncryptedIpfsHash, uint256 version, uint256 timestamp)',
  'event SharingPermissionGranted(uint256 indexed tokenId, address indexed sharedWith, uint256 expiresAt)',
]

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PORTFOLIO_NFT_CONTRACT || ''
const CELO_SEPOLIA_CHAIN_ID = '0xaef3' // 44787 in hex

export interface MintingProgress {
  step: 'preparing' | 'encrypting' | 'uploading' | 'minting' | 'confirming' | 'completed' | 'error'
  message: string
  txHash?: string
  tokenId?: number
}

export class PortfolioNFTService {
  private provider: ethers.BrowserProvider | null = null
  private contract: ethers.Contract | null = null

  /**
   * Initialize MetaMask connection
   */
  async connectMetaMask(): Promise<string> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      // Switch to Celo Sepolia if not already
      await this.switchToCeloSepolia()

      this.provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await this.provider.getSigner()
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, PORTFOLIO_NFT_ABI, signer)

      return accounts[0]
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Please connect your MetaMask wallet to continue')
      }
      throw error
    }
  }

  /**
   * Switch to Celo Sepolia network
   */
  async switchToCeloSepolia(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CELO_SEPOLIA_CHAIN_ID }],
      })
    } catch (error: any) {
      // Chain not added, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: CELO_SEPOLIA_CHAIN_ID,
              chainName: 'Celo Sepolia Testnet',
              nativeCurrency: {
                name: 'CELO',
                symbol: 'CELO',
                decimals: 18,
              },
              rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
              blockExplorerUrls: ['https://celo-sepolia.blockscout.com'],
            },
          ],
        })
      } else {
        throw error
      }
    }
  }

  /**
   * Mint portfolio NFT with MetaMask notifications
   */
  async mintPortfolioNFT(
    portfolioData: any,
    onProgress: (progress: MintingProgress) => void
  ): Promise<{
    tokenId: number
    txHash: string
    explorerUrl: string
  }> {
    try {
      // Step 1: Connect MetaMask
      onProgress({
        step: 'preparing',
        message: '🔗 Connecting to MetaMask...',
      })

      const walletAddress = await this.connectMetaMask()

      // Step 2: Encrypt portfolio data
      onProgress({
        step: 'encrypting',
        message: '🔐 Encrypting portfolio data with AES-256-GCM...',
      })

      const encryptedData = encryptionService.encrypt(portfolioData)

      // Step 3: Upload to IPFS (simulated - actual upload happens in backend)
      onProgress({
        step: 'uploading',
        message: '📤 Uploading encrypted data to IPFS...',
      })

      // In real implementation, this would call your IPFS service
      const ipfsHash = `ipfs://encrypted_${Date.now()}`

      // Step 4: Mint NFT on Celo blockchain
      onProgress({
        step: 'minting',
        message: '🎨 Minting Portfolio NFT on Celo Sepolia...\n\n⚠️ Please confirm the transaction in MetaMask',
      })

      if (!this.contract) {
        throw new Error('Contract not initialized')
      }

      // Send transaction
      const tx = await this.contract.mintPortfolio(walletAddress, ipfsHash)

      onProgress({
        step: 'confirming',
        message: `⏳ Waiting for blockchain confirmation...\n\nTransaction: ${tx.hash.substring(0, 10)}...`,
        txHash: tx.hash,
      })

      // Show MetaMask notification
      this.showMetaMaskNotification('Portfolio NFT Minting', 'Your portfolio is being minted on Celo blockchain...')

      // Wait for confirmation
      const receipt = await tx.wait()

      // Extract token ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log)
          return parsed?.name === 'PortfolioMinted'
        } catch {
          return false
        }
      })

      let tokenId = 0
      if (event) {
        const parsed = this.contract.interface.parseLog(event)
        tokenId = Number(parsed?.args[0])
      }

      const explorerUrl = `https://celo-sepolia.blockscout.com/tx/${tx.hash}`

      // Step 5: Completed
      onProgress({
        step: 'completed',
        message: `✅ Portfolio NFT Minted Successfully!\n\nToken ID: #${tokenId}\nTransaction: ${tx.hash}`,
        txHash: tx.hash,
        tokenId,
      })

      // Show success notification
      this.showMetaMaskNotification(
        '✅ Portfolio NFT Minted!',
        `Your portfolio NFT #${tokenId} has been minted on Celo blockchain`
      )

      return {
        tokenId,
        txHash: tx.hash,
        explorerUrl,
      }
    } catch (error: any) {
      onProgress({
        step: 'error',
        message: `❌ Error: ${error.message}`,
      })
      throw error
    }
  }

  /**
   * Update portfolio NFT (after 3 months)
   */
  async updatePortfolioNFT(
    tokenId: number,
    newPortfolioData: any,
    onProgress: (progress: MintingProgress) => void
  ): Promise<{ txHash: string; version: number }> {
    try {
      onProgress({
        step: 'preparing',
        message: '🔄 Preparing portfolio update...',
      })

      await this.connectMetaMask()

      // Check if update is allowed
      const [canUpdate, timeRemaining] = await this.contract!.canUpdatePortfolio(tokenId)

      if (!canUpdate) {
        const daysRemaining = Math.ceil(Number(timeRemaining) / 86400)
        throw new Error(
          `Portfolio can only be updated every 3 months. Please wait ${daysRemaining} more days.`
        )
      }

      onProgress({
        step: 'encrypting',
        message: '🔐 Encrypting updated portfolio data...',
      })

      const encryptedData = encryptionService.encrypt(newPortfolioData)
      const ipfsHash = `ipfs://encrypted_updated_${Date.now()}`

      onProgress({
        step: 'minting',
        message: '🔄 Updating Portfolio NFT on blockchain...\n\n⚠️ Please confirm in MetaMask',
      })

      const tx = await this.contract!.updatePortfolio(tokenId, ipfsHash)

      onProgress({
        step: 'confirming',
        message: `⏳ Confirming update...\n\nTransaction: ${tx.hash.substring(0, 10)}...`,
        txHash: tx.hash,
      })

      this.showMetaMaskNotification('Portfolio Update', 'Updating your portfolio NFT with new skills...')

      const receipt = await tx.wait()

      // Extract version from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log)
          return parsed?.name === 'PortfolioUpdated'
        } catch {
          return false
        }
      })

      let version = 1
      if (event) {
        const parsed = this.contract!.interface.parseLog(event)
        version = Number(parsed?.args[2])
      }

      onProgress({
        step: 'completed',
        message: `✅ Portfolio Updated!\n\nVersion: ${version}\nTransaction: ${tx.hash}`,
        txHash: tx.hash,
      })

      this.showMetaMaskNotification('✅ Portfolio Updated!', `Your portfolio is now version ${version}`)

      return {
        txHash: tx.hash,
        version,
      }
    } catch (error: any) {
      onProgress({
        step: 'error',
        message: `❌ Error: ${error.message}`,
      })
      throw error
    }
  }

  /**
   * Grant sharing permission to another user
   */
  async grantSharingPermission(
    tokenId: number,
    sharedWithAddress: string,
    durationDays: number
  ): Promise<{ txHash: string }> {
    await this.connectMetaMask()

    // Generate encrypted key for the viewer
    const decryptionKey = encryptionService.hash(`${tokenId}_${sharedWithAddress}_${Date.now()}`)
    const encryptedKey = encryptionService.encrypt({ key: decryptionKey })

    const durationSeconds = durationDays * 86400

    const tx = await this.contract!.grantSharingPermission(
      tokenId,
      sharedWithAddress,
      durationSeconds,
      encryptedKey
    )

    this.showMetaMaskNotification(
      'Sharing Permission Granted',
      `Portfolio #${tokenId} shared for ${durationDays} days`
    )

    await tx.wait()

    return { txHash: tx.hash }
  }

  /**
   * Revoke sharing permission
   */
  async revokeSharingPermission(tokenId: number, revokeFromAddress: string): Promise<{ txHash: string }> {
    await this.connectMetaMask()

    const tx = await this.contract!.revokeSharingPermission(tokenId, revokeFromAddress)

    this.showMetaMaskNotification('Sharing Revoked', `Access to portfolio #${tokenId} has been revoked`)

    await tx.wait()

    return { txHash: tx.hash }
  }

  /**
   * Check if user can view portfolio
   */
  async canViewPortfolio(tokenId: number, viewerAddress: string): Promise<{ canView: boolean; encryptionKey: string }> {
    await this.connectMetaMask()

    const [canView, encryptionKey] = await this.contract!.canViewPortfolio(tokenId, viewerAddress)

    return { canView, encryptionKey }
  }

  /**
   * Get user's portfolios
   */
  async getUserPortfolios(address: string): Promise<number[]> {
    await this.connectMetaMask()

    const tokenIds = await this.contract!.getPortfoliosByOwner(address)
    return tokenIds.map((id: any) => Number(id))
  }

  /**
   * Get portfolio details
   */
  async getPortfolioDetails(tokenId: number): Promise<{
    encryptedIpfsHash: string
    lastUpdated: number
    nextUpdateAllowed: number
    owner: string
    isActive: boolean
    version: number
  }> {
    await this.connectMetaMask()

    const [encryptedIpfsHash, lastUpdated, nextUpdateAllowed, owner, isActive, version] =
      await this.contract!.getPortfolio(tokenId)

    return {
      encryptedIpfsHash,
      lastUpdated: Number(lastUpdated),
      nextUpdateAllowed: Number(nextUpdateAllowed),
      owner,
      isActive,
      version: Number(version),
    }
  }

  /**
   * Show MetaMask notification
   */
  private showMetaMaskNotification(title: string, message: string): void {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      // Try browser notification first
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body: message })
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, { body: message })
            }
          })
        }
      }
    }
  }

  /**
   * Get contract instance (for external access)
   */
  getContract(): ethers.Contract | null {
    return this.contract
  }
}

export const portfolioNFTService = new PortfolioNFTService()
