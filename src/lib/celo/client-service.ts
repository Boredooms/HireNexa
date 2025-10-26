// Client-side Celo service - User pays gas via MetaMask
import { BrowserProvider, Contract } from 'ethers'

export class ClientCeloService {
  // Mint NFT using user's wallet (MetaMask)
  async mintPortfolioNFT(params: {
    metadataIpfs: string
  }): Promise<{
    txHash: string
    tokenId: number | null
  }> {
    const portfolioNFTAddress = process.env.NEXT_PUBLIC_PORTFOLIO_NFT_CONTRACT
    
    if (!portfolioNFTAddress) {
      throw new Error('Portfolio NFT contract not configured')
    }

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to mint NFT.')
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet connected. Please connect your wallet.')
      }

      const userAddress = accounts[0]
      console.log(`👛 User wallet: ${userAddress}`)

      // Create provider and signer
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Portfolio NFT contract ABI
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
          "name": "Transfer",
          "type": "event",
          "anonymous": false,
          "inputs": [
            { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
            { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
          ]
        },
        {
          "name": "PortfolioMinted",
          "type": "event",
          "anonymous": false,
          "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "encryptedIpfsHash", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "encryptionType", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
          ]
        }
      ]

      // Create contract instance
      const contract = new Contract(portfolioNFTAddress, abi, signer)

      console.log(`📝 Minting NFT to ${userAddress}...`)
      console.log(`📦 IPFS Hash: ${params.metadataIpfs}`)
      console.log(`💰 User will pay gas fee (~0.0001 CELO)`)
      console.log(`🔒 Security: AES-256-GCM encrypted portfolio data`)
      console.log(`✅ Privacy: Only you can decrypt your full portfolio`)
      console.log(`📊 Public: NFT shows stats only (not sensitive details)`)

      // Mint the NFT (user pays gas)
      // Note: Custom messages in MetaMask are not possible due to security
      // The encryption info is shown in our pre-transaction modal instead
      const tx = await contract.mintPortfolio(userAddress, params.metadataIpfs)
      
      console.log(`⏳ Transaction sent: ${tx.hash}`)
      console.log(`⏳ Waiting for confirmation...`)

      // Wait for transaction to be mined
      const receipt = await tx.wait()
      
      console.log(`✅ NFT minted! TX: ${receipt.hash}`)

      // Extract token ID from events
      let tokenId: number | null = null
      
      if (receipt.logs && receipt.logs.length > 0) {
        // Find Transfer event
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data
            })
            
            if (parsedLog && parsedLog.name === 'Transfer') {
              tokenId = Number(parsedLog.args.tokenId)
              console.log(`🎫 Token ID: ${tokenId}`)
              break
            }
          } catch (e) {
            // Not a Transfer event, skip
          }
        }
      }

      // Fallback: extract from raw topics
      if (!tokenId && receipt.logs && receipt.logs.length > 0) {
        const transferLog = receipt.logs[0]
        if (transferLog.topics && transferLog.topics.length >= 4) {
          const hexTokenId = transferLog.topics[3]
          tokenId = parseInt(hexTokenId, 16)
          console.log(`🎫 Token ID (from topics): ${tokenId}`)
        }
      }

      return {
        txHash: receipt.hash,
        tokenId
      }
    } catch (error: any) {
      console.error('Error minting NFT:', error)
      
      // User-friendly error messages
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user')
      } else if (error.code === -32603) {
        throw new Error('Insufficient funds for gas. Please add CELO to your wallet.')
      } else {
        throw new Error(`Failed to mint NFT: ${error.message}`)
      }
    }
  }

  // Check if user has enough CELO for gas
  async checkGasBalance(): Promise<{
    hasEnough: boolean
    balance: string
    required: string
  }> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      
      // Get balance
      const balance = await provider.getBalance(address)
      const balanceInCelo = Number(balance) / 1e18
      
      // Estimate gas needed (~0.0001 CELO)
      const requiredGas = 0.0001
      
      return {
        hasEnough: balanceInCelo >= requiredGas,
        balance: balanceInCelo.toFixed(4),
        required: requiredGas.toFixed(4)
      }
    } catch (error: any) {
      console.error('Error checking balance:', error)
      throw error
    }
  }
}

export const clientCeloService = new ClientCeloService()
