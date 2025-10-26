'use client'

import { useState } from 'react'
import { clientCeloService } from '@/lib/celo/client-service'

interface MintNFTButtonProps {
  metadataIpfsHash: string
  onSuccess?: (tokenId: number, txHash: string) => void
  onError?: (error: string) => void
}

export function MintNFTButton({ metadataIpfsHash, onSuccess, onError }: MintNFTButtonProps) {
  const [minting, setMinting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ tokenId: number; txHash: string } | null>(null)
  const [gasInfo, setGasInfo] = useState<{ balance: string; required: string } | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const checkBalance = async () => {
    try {
      setChecking(true)
      setError(null)
      
      const { hasEnough, balance, required } = await clientCeloService.checkGasBalance()
      
      setGasInfo({ balance, required })
      
      if (!hasEnough) {
        setError(`Insufficient balance. You have ${balance} CELO but need ${required} CELO for gas.`)
        return false
      }
      
      return true
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to check balance'
      setError(errorMsg)
      onError?.(errorMsg)
      return false
    } finally {
      setChecking(false)
    }
  }

  const handleInitialClick = async () => {
    // Check balance first
    const hasBalance = await checkBalance()
    if (!hasBalance) {
      return
    }
    
    // Show confirmation modal
    setShowConfirmation(true)
  }

  const handleConfirmMint = async () => {
    try {
      setMinting(true)
      setError(null)
      setShowConfirmation(false)

      console.log('🎨 Starting NFT mint...')
      
      // Mint NFT (user pays gas via MetaMask)
      const result = await clientCeloService.mintPortfolioNFT({
        metadataIpfs: metadataIpfsHash
      })

      console.log('✅ NFT minted!', result)

      // Save to database
      const response = await fetch('/api/portfolio/mint-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadataIpfsHash,
          txHash: result.txHash,
          tokenId: result.tokenId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save NFT info to database')
      }

      setSuccess({
        tokenId: result.tokenId || 0,
        txHash: result.txHash
      })
      
      onSuccess?.(result.tokenId || 0, result.txHash)
    } catch (err: any) {
      console.error('❌ Mint error:', err)
      
      let errorMsg = 'Failed to mint NFT'
      
      if (err.message.includes('rejected')) {
        errorMsg = 'Transaction rejected by user'
      } else if (err.message.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for gas. Please add CELO to your wallet.'
      } else if (err.message.includes('MetaMask')) {
        errorMsg = 'MetaMask not installed. Please install MetaMask extension.'
      } else if (err.message) {
        errorMsg = err.message
      }
      
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setMinting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="space-y-2">
          <p className="font-semibold text-green-800">✅ NFT Minted Successfully!</p>
          <p className="text-sm text-green-700">Token ID: #{success.tokenId}</p>
          <a
            href={`https://celo-sepolia.blockscout.com/tx/${success.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 underline"
          >
            View on Explorer →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Security & Encryption Info */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-black rounded-lg p-4">
        <h4 className="font-bold text-black mb-3 flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          What You're Minting
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>Blockchain-Verified Portfolio NFT</strong> on Celo Sepolia</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>AES-256-GCM Encryption</strong> - Military-grade security</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>Private Data:</strong> Skills, projects, and personal info are encrypted</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>Public Stats:</strong> Only counts visible (not details)</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p><strong>You Own It:</strong> NFT is yours, stored on IPFS forever</p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-gray-50 border-2 border-black rounded">
          <p className="text-xs font-semibold text-gray-700 mb-1">IPFS Metadata Hash:</p>
          <p className="text-xs font-mono text-black font-semibold break-all">
            {metadataIpfsHash.replace('ipfs://', '')}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-black rounded-lg p-4">
          <p className="text-red-800 text-sm font-semibold">{error}</p>
          {error.includes('Insufficient') && (
            <div className="mt-2">
              <a
                href="https://faucet.celo.org/sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-red-600 hover:text-red-700 underline font-semibold"
              >
                Get free CELO from faucet →
              </a>
            </div>
          )}
        </div>
      )}

      {gasInfo && !error && (
        <div className="bg-yellow-50 border-2 border-black rounded-lg p-3">
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-semibold">💰 Your balance: {gasInfo.balance} CELO</p>
            <p>⛽ Gas required: ~{gasInfo.required} CELO</p>
          </div>
        </div>
      )}

      <button
        onClick={handleInitialClick}
        disabled={minting || checking}
        className="w-full bg-[#FCFF52] hover:bg-[#35D07F] disabled:bg-gray-400 text-black font-bold py-4 px-6 rounded-lg border-2 border-black transition-colors text-lg"
      >
        {minting ? (
          <span>⏳ Minting NFT... (Approve in MetaMask)</span>
        ) : checking ? (
          <span>⏳ Checking Balance...</span>
        ) : (
          <span>🎨 Review & Mint Portfolio NFT</span>
        )}
      </button>

      <div className="bg-blue-50 border-2 border-black rounded-lg p-3">
        <p className="text-xs text-gray-700 text-center">
          <strong>Next Step:</strong> Review transaction details, then MetaMask will open for approval.
        </p>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border-4 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-black mb-4 flex items-center gap-2">
                <span className="text-3xl">⚠️</span>
                Confirm NFT Minting
              </h3>

              {/* Transaction Details */}
              <div className="space-y-4 mb-6">
                <div className="bg-yellow-50 border-2 border-black rounded-lg p-4">
                  <h4 className="font-bold text-black mb-2">📋 What You're Minting:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Portfolio NFT</strong> on Celo Sepolia blockchain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>ERC-721 Token</strong> - Industry standard NFT</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span><strong>Permanent ownership</strong> - You own it forever</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border-2 border-black rounded-lg p-4">
                  <h4 className="font-bold text-black mb-2">🔒 Encryption & Privacy:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">🔐</span>
                      <span><strong>AES-256-GCM Encryption</strong> - Military-grade security</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">🔐</span>
                      <span><strong>Private Data:</strong> Skills, projects, personal info encrypted</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">🔐</span>
                      <span><strong>Public Stats:</strong> Only counts visible (not details)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">🔐</span>
                      <span><strong>Decryption Key:</strong> Only YOU have access</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 border-2 border-black rounded-lg p-4">
                  <h4 className="font-bold text-black mb-2">💰 Transaction Cost:</h4>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><strong>Network:</strong> Celo Sepolia Testnet</p>
                    <p><strong>Gas Fee:</strong> ~0.0001 CELO (~$0.00006 USD)</p>
                    <p><strong>Your Balance:</strong> {gasInfo?.balance} CELO</p>
                    <p className="text-green-600 font-semibold">✓ Sufficient balance</p>
                  </div>
                </div>

                <div className="bg-gray-50 border-2 border-black rounded-lg p-4">
                  <h4 className="font-bold text-black mb-2">📦 IPFS Metadata:</h4>
                  <p className="text-xs font-mono text-black font-semibold break-all bg-white p-2 rounded border-2 border-gray-300">
                    {metadataIpfsHash.replace('ipfs://', '')}
                  </p>
                </div>

                <div className="bg-purple-50 border-2 border-black rounded-lg p-4">
                  <h4 className="font-bold text-black mb-2">⚡ What Happens Next:</h4>
                  <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                    <li>You click "Confirm & Mint NFT" below</li>
                    <li>MetaMask popup opens for approval</li>
                    <li>You review and confirm in MetaMask</li>
                    <li>Transaction is sent to blockchain</li>
                    <li>NFT is minted to your wallet (~10 seconds)</li>
                    <li>You receive confirmation with Token ID</li>
                  </ol>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-6 py-3 bg-white border-2 border-black text-black rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  ← Cancel
                </button>
                <button
                  onClick={handleConfirmMint}
                  className="flex-1 px-6 py-3 bg-[#FCFF52] text-black rounded-lg font-semibold hover:bg-[#35D07F] border-2 border-black transition"
                >
                  Confirm & Mint NFT →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
