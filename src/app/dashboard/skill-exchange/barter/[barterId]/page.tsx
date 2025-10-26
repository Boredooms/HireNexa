'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { lightweightEscrowService } from '@/lib/blockchain/lightweightEscrow'

export default function BarterDetailsPage() {
  const { userId } = useAuth()
  const params = useParams()
  const router = useRouter()
  const barterId = params.barterId as string

  const [barter, setBarter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)

  useEffect(() => {
    loadBarter()
    checkWallet()
  }, [barterId])

  const loadBarter = async () => {
    try {
      const response = await fetch(`/api/skill-exchange/barter/${barterId}`)
      const data = await response.json()
      setBarter(data.barter)
    } catch (error) {
      console.error('Error loading barter:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setWalletConnected(true)
        }
      } catch (error) {
        console.error('Error checking wallet:', error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        setWalletConnected(true)
        alert('Wallet connected! ✅')
      } catch (error) {
        console.error('Error connecting wallet:', error)
        alert('Failed to connect wallet')
      }
    } else {
      alert('Please install MetaMask!')
      window.open('https://metamask.io/download/', '_blank')
    }
  }

  const handleAccept = async () => {
    if (!walletConnected) {
      alert('Please connect your wallet first!')
      return
    }

    if (!barter?.blockchain_barter_id) {
      alert('Blockchain barter ID not found!')
      return
    }

    try {
      setAccepting(true)

      // Accept on blockchain
      console.log('📤 Accepting barter on blockchain...')
      const txHash = await lightweightEscrowService.acceptBarter(
        barter.blockchain_barter_id,
        barter.deposit_amount
      )

      console.log('✅ Blockchain acceptance successful!')
      console.log('Transaction:', txHash)

      // Update database
      const response = await fetch(`/api/skill-exchange/barter/${barterId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockchain_tx_hash: txHash
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update barter status')
      }

      alert('✅ Barter accepted successfully!')
      router.push('/dashboard/skill-exchange')
    } catch (error: any) {
      console.error('Error accepting barter:', error)
      alert(`Failed to accept barter: ${error.message}`)
    } finally {
      setAccepting(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this barter proposal?')) {
      return
    }

    try {
      const response = await fetch(`/api/skill-exchange/barter/${barterId}/reject`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to reject barter')

      alert('Barter rejected')
      router.push('/dashboard/skill-exchange')
    } catch (error) {
      console.error('Error rejecting barter:', error)
      alert('Failed to reject barter')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex items-center justify-center">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    )
  }

  if (!barter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex items-center justify-center">
        <div className="text-2xl font-bold text-white">Barter not found</div>
      </div>
    )
  }

  const isRecipient = barter.recipient_id === userId
  
  // Debug logging
  console.log('🔍 Debug Info:')
  console.log('Current userId:', userId)
  console.log('Barter proposer_id:', barter.proposer_id)
  console.log('Barter recipient_id:', barter.recipient_id)
  console.log('Is Recipient?', isRecipient)

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-white/20 bg-white/10 rounded font-bold text-gray-300 hover:bg-white/20 transition"
          >
            ← Back
          </button>
        </div>

        {/* Barter Details Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-8">
          <h1 className="text-3xl font-black mb-6 text-white">🤝 Barter Proposal</h1>

          {/* Status Badge */}
          <div className={`inline-block px-4 py-2 rounded-lg border font-bold mb-6 ${
            barter.status === 'pending' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' :
            barter.status === 'accepted' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
            barter.status === 'rejected' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
            'bg-gray-500/20 border-gray-500/50 text-gray-300'
          }`}>
            {barter.status === 'pending' && '⏳ Pending'}
            {barter.status === 'accepted' && '✅ Accepted'}
            {barter.status === 'rejected' && '❌ Rejected'}
            {barter.status === 'completed' && '🎉 Completed'}
          </div>

          {/* Details */}
          <div className="space-y-4 mb-8">
            <div>
              <div className="text-sm font-bold text-gray-400">Skill Offered</div>
              <div className="text-xl font-bold text-white">{barter.skill_offered}</div>
            </div>

            <div>
              <div className="text-sm font-bold text-gray-400">Skill Requested</div>
              <div className="text-xl font-bold text-white">{barter.skill_requested}</div>
            </div>

            <div className="flex gap-4">
              <div>
                <div className="text-sm font-bold text-gray-400">Duration</div>
                <div className="text-lg font-bold text-white">{barter.duration} days</div>
              </div>

              <div>
                <div className="text-sm font-bold text-gray-400">Deposit Amount</div>
                <div className="text-lg font-bold text-white">{barter.deposit_amount} CELO</div>
              </div>
            </div>

            {barter.description && (
              <div>
                <div className="text-sm font-bold text-gray-400">Description</div>
                <div className="text-lg text-gray-300">{barter.description}</div>
              </div>
            )}

            {barter.blockchain_tx_hash && (
              <div>
                <div className="text-sm font-bold text-gray-400">Blockchain Transaction</div>
                <a
                  href={`https://celo-sepolia.blockscout.com/tx/${barter.blockchain_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3B82F6] hover:underline font-mono text-sm"
                >
                  {barter.blockchain_tx_hash.slice(0, 10)}...{barter.blockchain_tx_hash.slice(-8)}
                </a>
              </div>
            )}
          </div>

          {/* Actions for Recipient */}
          {isRecipient && barter.status === 'pending' && (
            <>
              {/* Wallet Connection */}
              {!walletConnected ? (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">🦊</div>
                  <h3 className="text-xl font-black mb-4 text-amber-300">Connect MetaMask</h3>
                  <p className="text-sm font-semibold mb-4 text-amber-200">
                    You need to connect your wallet to accept this barter
                  </p>
                  <button
                    onClick={connectWallet}
                    className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg font-black text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="font-bold text-green-300">✅ Wallet Connected</div>
                </div>
              )}

              {/* Accept/Reject Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAccept}
                  disabled={!walletConnected || accepting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg font-black text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accepting ? 'Accepting...' : '✅ Accept Barter'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={accepting}
                  className="flex-1 px-6 py-4 bg-red-500/20 border border-red-500/50 rounded-lg font-black text-red-300 hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❌ Reject
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-400 text-center">
                ⚠️ You'll need to deposit {barter.deposit_amount} CELO to accept this barter
              </div>
            </>
          )}

          {/* Message for Proposer */}
          {!isRecipient && barter.status === 'pending' && (
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 text-center">
              <div className="font-bold text-blue-300">⏳ Waiting for the other user to accept</div>
            </div>
          )}

          {/* Accepted Status */}
          {barter.status === 'accepted' && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
              <div className="font-bold text-green-300">✅ Barter is active!</div>
              <div className="text-sm text-green-400 mt-2">You can now start video calls and chat</div>
              <button
                onClick={() => router.push('/dashboard/skill-exchange')}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg font-bold text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
              >
                Go to Skill Exchange
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
