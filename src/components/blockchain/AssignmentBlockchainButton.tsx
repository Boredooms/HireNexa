'use client'

import { useState } from 'react'
import { BrowserProvider } from 'ethers'
import { AssignmentEscrowService } from '@/lib/blockchain/assignmentEscrowService'

interface AssignmentBlockchainButtonProps {
  assignmentData: {
    title: string
    metadataURI: string
    rewardAmount: string
    maxSubmissions: number
    autoVerify: boolean
    expiresAt: Date
  }
  onSuccess?: (assignmentId: number, txHash: string) => void
  onError?: (error: Error) => void
}

export function AssignmentBlockchainButton({
  assignmentData,
  onSuccess,
  onError
}: AssignmentBlockchainButtonProps) {
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const handleCreateAssignment = async () => {
    try {
      setLoading(true)

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to continue')
      }

      // Request account access - THIS WILL SHOW METAMASK POPUP!
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      // Create provider
      const provider = new BrowserProvider(window.ethereum)

      // Check network
      const network = await provider.getNetwork()
      const CELO_SEPOLIA_CHAIN_ID = BigInt(11142220)
      
      if (network.chainId !== CELO_SEPOLIA_CHAIN_ID) {
        // Switch to Celo Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa0dc' }], // 11142220 in hex
          })
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa0dc',
                chainName: 'Celo Sepolia Testnet',
                nativeCurrency: {
                  name: 'S-CELO',
                  symbol: 'S-CELO',
                  decimals: 18
                },
                rpcUrls: ['https://forno.celo-sepolia.celo-testnet.org'],
                blockExplorerUrls: ['https://celo-sepolia.blockscout.com']
              }]
            })
          } else {
            throw switchError
          }
        }
      }

      // Initialize service
      const escrowService = new AssignmentEscrowService(provider)

      // Create assignment on blockchain - THIS WILL SHOW METAMASK POPUP FOR APPROVAL!
      console.log('Creating assignment on blockchain...')
      const { assignmentId, txHash } = await escrowService.createAssignment(
        assignmentData.title,
        assignmentData.metadataURI,
        assignmentData.rewardAmount,
        assignmentData.maxSubmissions,
        assignmentData.autoVerify,
        assignmentData.expiresAt
      )

      console.log('✅ Assignment created on blockchain!')
      console.log('Assignment ID:', assignmentId)
      console.log('Transaction:', txHash)

      setTxHash(txHash)
      onSuccess?.(assignmentId, txHash)

    } catch (error: any) {
      console.error('Error creating assignment:', error)
      onError?.(error)
      alert(error.message || 'Failed to create assignment on blockchain')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleCreateAssignment}
        disabled={loading}
        className="w-full px-6 py-3 bg-[#FCFF52] text-black font-bold rounded border-2 border-black hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Processing on Blockchain...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            🔐 Create Assignment with Escrow
          </span>
        )}
      </button>

      {txHash && (
        <div className="p-4 bg-green-50 border-2 border-green-600 rounded">
          <p className="text-sm font-bold text-green-800 mb-2">✅ Transaction Successful!</p>
          <a
            href={`https://celo-sepolia.blockscout.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline break-all"
          >
            View on Blockscout: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </a>
        </div>
      )}

      <div className="text-xs text-gray-600 space-y-1">
        <p>⚡ This will trigger 2 MetaMask popups:</p>
        <p>1️⃣ Approve S-CELO tokens for escrow</p>
        <p>2️⃣ Create assignment on Celo Sepolia</p>
      </div>
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on?: (event: string, handler: (...args: any[]) => void) => void
      removeListener?: (event: string, handler: (...args: any[]) => void) => void
    }
  }
}
