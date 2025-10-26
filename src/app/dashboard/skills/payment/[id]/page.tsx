'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wallet, CheckCircle } from 'lucide-react'
import { peerReviewEscrowService } from '@/lib/blockchain/peerReviewEscrowService'
import { createClient } from '@/lib/supabase/client'

export default function SkillPaymentPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const params = useParams()
  const submissionId = params.id as string

  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [celoBalance, setCeloBalance] = useState('0')

  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const fetchSubmission = async () => {
      console.log('Fetching submission:', { submissionId, userId })
      
      try {
        const response = await fetch(`/api/skills/submission/${submissionId}`)
        const data = await response.json()

        console.log('Submission API response:', data)

        if (!response.ok || !data.submission) {
          console.error('Error fetching submission:', data.error)
          alert(`Submission not found: ${data.error || 'Unknown error'}`)
          router.push('/dashboard/skills')
          return
        }

        setSubmission(data.submission)
        setLoading(false)
      } catch (error: any) {
        console.error('Error fetching submission:', error)
        alert(`Failed to load submission: ${error.message}`)
        router.push('/dashboard/skills')
      }
    }

    fetchSubmission()
  }, [userId, submissionId, router])

  const connectWallet = async () => {
    try {
      const { address, balance } = await peerReviewEscrowService.connect()
      setWalletAddress(address)
      setCeloBalance(balance)
      setWalletConnected(true)
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      alert(`Failed to connect wallet: ${error.message}`)
    }
  }

  const handlePayment = async () => {
    if (!walletConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (parseFloat(celoBalance) < 0.01) {
      alert('Insufficient CELO balance. You need at least 0.01 CELO.')
      return
    }

    setPaying(true)

    try {
      // Ensure wallet is connected (reconnect if needed)
      try {
        await peerReviewEscrowService.connect()
      } catch (connectError) {
        console.log('Already connected or reconnecting...')
      }

      // Pay via blockchain
      const txHash = await peerReviewEscrowService.payForVerification(submissionId)

      // Update database via API route (uses service role)
      const updateResponse = await fetch('/api/skills/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          txHash,
        }),
      })

      const updateData = await updateResponse.json()

      if (!updateResponse.ok) {
        console.error('Error updating database:', updateData.error)
        alert('Payment successful but failed to update database. Transaction: ' + txHash)
        return
      }

      alert('✅ Payment successful! Your skill is now awaiting review.')
      router.push('/dashboard/skills')
    } catch (error: any) {
      console.error('Error processing payment:', error)
      alert(`❌ Payment failed: ${error.message}`)
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex items-center justify-center">
        <div className="text-xl font-bold text-white">Loading...</div>
      </div>
    )
  }

  if (submission.payment_status === 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex items-center justify-center">
        <div className="max-w-md bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-[#3B82F6] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Payment Already Completed</h2>
          <p className="text-gray-400 mb-6">
            Your skill is awaiting review by a peer reviewer.
          </p>
          <Link
            href="/dashboard/skills"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
          >
            View My Skills
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard/skills" className="text-gray-400 hover:text-gray-300 mb-2 inline-flex items-center gap-1 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Skills
          </Link>
          <h1 className="text-2xl font-bold text-white">Complete Payment</h1>
          <p className="text-gray-400 text-sm mt-1">Pay for skill verification to proceed</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Skill Details */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Skill Details</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-400">Skill Name</div>
                <div className="font-bold text-white">{submission.skill_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Category</div>
                <div className="font-bold text-white capitalize">{submission.skill_category}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Proficiency Level</div>
                <div className="font-bold text-white capitalize">{submission.proficiency_level}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Description</div>
                <div className="text-sm text-gray-300">{submission.description.substring(0, 150)}...</div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Payment</h2>

            {/* Cost Breakdown */}
            <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Verification Fee</span>
                <span className="font-bold text-white">0.01 CELO</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-xs">Network</span>
                <span className="font-bold text-white text-xs">Celo Sepolia</span>
              </div>
              <div className="border-t border-white/20 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-white">Total</span>
                  <span className="font-bold text-xl text-[#3B82F6]">0.01 CELO</span>
                </div>
              </div>
            </div>

            {/* Wallet Connection */}
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition mb-4 flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Connect MetaMask
              </button>
            ) : (
              <div className="mb-4">
                <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Connected Wallet</div>
                  <div className="font-mono text-sm text-white mb-2">
                    {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Balance:</span>{' '}
                    <span className="font-bold text-[#3B82F6]">{parseFloat(celoBalance).toFixed(4)} CELO</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!walletConnected || paying}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paying ? 'Processing Payment...' : '💳 Pay 0.01 CELO'}
            </button>

            {/* Info */}
            <div className="mt-6 text-sm text-gray-400">
              <p className="mb-2">
                ℹ️ Your skill will be reviewed by an approved peer reviewer within 48 hours.
              </p>
              <p className="mb-2">
                🔒 Payment is secured via smart contract on Celo Sepolia testnet.
              </p>
              <p className="text-xs">
                💡 Get free Celo Sepolia CELO from: <a href="https://faucet.celo.org" target="_blank" className="text-[#3B82F6] hover:underline">faucet.celo.org</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
