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

      if (!response.ok) throw new Error('Failed to update barter status')

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    )
  }

  if (!barter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-2xl font-bold">Barter not found</div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white border-2 border-black rounded font-bold hover:bg-gray-100 transition"
          >
            ← Back
          </button>
        </div>

        {/* Barter Details Card */}
        <div className="bg-white border-4 border-black rounded-lg p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-3xl font-black mb-6">🤝 Barter Proposal</h1>

          {/* Status Badge */}
          <div className={`inline-block px-4 py-2 rounded-lg border-2 border-black font-bold mb-6 ${
            barter.status === 'pending' ? 'bg-blue-100 text-blue-800' :
            barter.status === 'accepted' ? 'bg-green-100 text-green-800' :
            barter.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {barter.status === 'pending' && '⏳ Pending'}
            {barter.status === 'accepted' && '✅ Accepted'}
            {barter.status === 'rejected' && '❌ Rejected'}
            {barter.status === 'completed' && '🎉 Completed'}
          </div>

          {/* Details */}
          <div className="space-y-4 mb-8">
            <div>
              <div className="text-sm font-bold text-gray-600">Skill Offered</div>
              <div className="text-xl font-bold">{barter.skill_offered}</div>
            </div>

            <div>
              <div className="text-sm font-bold text-gray-600">Skill Requested</div>
              <div className="text-xl font-bold">{barter.skill_requested}</div>
            </div>

            <div className="flex gap-4">
              <div>
                <div className="text-sm font-bold text-gray-600">Duration</div>
                <div className="text-lg font-bold">{barter.duration} days</div>
              </div>

              <div>
                <div className="text-sm font-bold text-gray-600">Deposit Amount</div>
                <div className="text-lg font-bold">{barter.deposit_amount} CELO</div>
              </div>
            </div>

            {barter.description && (
              <div>
                <div className="text-sm font-bold text-gray-600">Description</div>
                <div className="text-lg">{barter.description}</div>
              </div>
            )}

            {barter.blockchain_tx_hash && (
              <div>
                <div className="text-sm font-bold text-gray-600">Blockchain Transaction</div>
                <a
                  href={`https://celo-sepolia.blockscout.com/tx/${barter.blockchain_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-mono text-sm"
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
                <div className="mb-6 bg-yellow-100 border-4 border-black rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">🦊</div>
                  <h3 className="text-xl font-black mb-4">Connect MetaMask</h3>
                  <p className="text-sm font-semibold mb-4">
                    You need to connect your wallet to accept this barter
                  </p>
                  <button
                    onClick={connectWallet}
                    className="px-6 py-3 bg-[#FCFF52] border-4 border-black rounded-lg font-black hover:bg-yellow-300 transition"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div className="mb-6 bg-green-100 border-2 border-black rounded-lg p-4">
                  <div className="font-bold">✅ Wallet Connected</div>
                </div>
              )}

              {/* Accept/Reject Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAccept}
                  disabled={!walletConnected || accepting}
                  className="flex-1 px-6 py-4 bg-[#35D07F] border-4 border-black rounded-lg font-black text-white hover:bg-[#2ab56f] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accepting ? 'Accepting...' : '✅ Accept Barter'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={accepting}
                  className="flex-1 px-6 py-4 bg-red-400 border-4 border-black rounded-lg font-black text-white hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❌ Reject
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-600 text-center">
                ⚠️ You'll need to deposit {barter.deposit_amount} CELO to accept this barter
              </div>
            </>
          )}

          {/* Message for Proposer */}
          {!isRecipient && barter.status === 'pending' && (
            <div className="bg-blue-100 border-2 border-black rounded-lg p-4 text-center">
              <div className="font-bold text-blue-800">⏳ Waiting for the other user to accept</div>
            </div>
          )}

          {/* Accepted Status */}
          {barter.status === 'accepted' && (
            <div className="bg-green-100 border-2 border-black rounded-lg p-4 text-center">
              <div className="font-bold text-green-800">✅ Barter is active!</div>
              <div className="text-sm text-green-600 mt-2">You can now start video calls and chat</div>
              <button
                onClick={() => router.push('/dashboard/skill-exchange')}
                className="mt-4 px-6 py-3 bg-[#35D07F] border-2 border-black rounded-lg font-bold text-white hover:bg-[#2ab56f] transition"
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
