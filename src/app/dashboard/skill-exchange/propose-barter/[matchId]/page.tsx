'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { lightweightEscrowService } from '@/lib/blockchain/lightweightEscrow'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProposeBarter() {
  const { userId } = useAuth()
  const params = useParams()
  const router = useRouter()
  const matchId = params.matchId as string

  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [proposing, setProposing] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  const [formData, setFormData] = useState({
    skillOffered: '',
    skillRequested: '',
    duration: 30,
    depositAmount: '0.1',
    description: '',
    learnerWalletAddress: '' // Ethereum wallet address
  })

  useEffect(() => {
    loadMatch()
    checkWallet()
  }, [matchId])

  const loadMatch = async () => {
    try {
      const response = await fetch(`/api/skill-exchange/match/${matchId}`)
      const data = await response.json()
      setMatch(data.match)
    } catch (error) {
      console.error('Error loading match:', error)
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
          setWalletAddress(accounts[0])
        }
      } catch (error) {
        console.error('Error checking wallet:', error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setWalletConnected(true)
        setWalletAddress(accounts[0])
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

  const handlePropose = async () => {
    if (!walletConnected) {
      alert('Please connect your wallet first!')
      return
    }

    // Validate all required fields
    if (!formData.skillOffered || !formData.skillOffered.trim()) {
      alert('Please enter the skill you will teach!')
      return
    }

    if (!formData.skillRequested || !formData.skillRequested.trim()) {
      alert('Please enter the skill you want to learn!')
      return
    }

    if (!formData.learnerWalletAddress || !formData.learnerWalletAddress.startsWith('0x')) {
      alert('Please enter a valid Ethereum wallet address for the learner!')
      return
    }

    try {
      setProposing(true)

      // Step 1: Propose barter on blockchain
      console.log('📤 Proposing barter on blockchain...')
      console.log('DEBUG - learnerAddress:', formData.learnerWalletAddress)
      console.log('DEBUG - duration:', formData.duration)
      console.log('DEBUG - depositAmount:', formData.depositAmount)
      
      const { barterId, txHash } = await lightweightEscrowService.proposeBarter({
        learnerAddress: formData.learnerWalletAddress,
        duration: formData.duration,
        depositAmount: formData.depositAmount
      })

      console.log('✅ Blockchain proposal successful!')
      console.log('Barter ID:', barterId)
      console.log('Transaction:', txHash)

      // Step 2: Save to database
      const response = await fetch('/api/skill-exchange/barter/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          blockchain_barter_id: barterId,
          blockchain_tx_hash: txHash,
          skill_offered: formData.skillOffered,
          skill_requested: formData.skillRequested,
          duration: formData.duration,
          deposit_amount: formData.depositAmount,
          description: formData.description
        })
      })

      if (!response.ok) throw new Error('Failed to save proposal')

      alert(`✅ Barter proposed successfully!\n\nBarter ID: ${barterId}\nDeposit: ${formData.depositAmount} CELO\nDuration: ${formData.duration} days`)
      
      router.push('/dashboard/skill-exchange')
    } catch (error: any) {
      console.error('Error proposing barter:', error)
      alert(`Failed to propose barter: ${error.message}`)
    } finally {
      setProposing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex items-center justify-center">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">🤝 Propose Skill Barter</h1>
              <p className="text-gray-400">With blockchain escrow protection</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-white/20 bg-white/10 rounded font-bold text-gray-300 hover:bg-white/20 transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Match Info */}
        <div className="mb-8 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <img
              src={match?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt={match?.name}
              className="w-20 h-20 rounded-full border-4 border-white/20"
            />
            <div>
              <h2 className="text-2xl font-black text-white">{match?.name}</h2>
              <p className="text-gray-400 font-semibold">{match?.experience_level}</p>
              <div className="flex gap-2 mt-2">
                {match?.skills_offered?.slice(0, 3).map((skill: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded font-bold text-sm text-[#3B82F6]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        {!walletConnected ? (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🦊</div>
            <h3 className="text-2xl font-black mb-4 text-amber-300">Connect MetaMask</h3>
            <p className="text-lg font-semibold mb-6 text-amber-200">
              You need to connect your wallet to propose a barter with blockchain escrow
            </p>
            <button
              onClick={connectWallet}
              className="px-8 py-4 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg font-black text-xl text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="mb-8 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <div className="font-bold text-green-300">Wallet Connected</div>
                <div className="text-sm font-mono text-green-400">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Barter Form */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-8">
          <h3 className="text-2xl font-black mb-6 text-white">Barter Details</h3>

          {/* Skill Offered */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2 text-gray-300">
              Skill You'll Teach <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.skillOffered}
              onChange={(e) => setFormData({ ...formData, skillOffered: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
              placeholder="e.g., React Development"
              required
            />
          </div>

          {/* Skill Requested */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2 text-gray-300">
              Skill You Want to Learn <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.skillRequested}
              onChange={(e) => setFormData({ ...formData, skillRequested: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
              placeholder="e.g., UI/UX Design"
              required
            />
          </div>

          {/* Learner Wallet Address */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2 text-gray-300">
              Learner's Wallet Address 
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.learnerWalletAddress}
              onChange={(e) => setFormData({ ...formData, learnerWalletAddress: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg font-mono text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
              placeholder="0x..."
            />
            <p className="text-sm text-gray-400 mt-2 font-semibold">
              ⚠️ Ask {match?.name} for their Ethereum wallet address (starts with 0x)
            </p>
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2 text-gray-300">Duration (days)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              min="7"
              max="365"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold text-white focus:outline-none focus:border-[#3B82F6]"
              aria-label="Barter Duration in Days"
            />
            <p className="text-sm text-gray-400 mt-2 font-semibold">
              Minimum 7 days, maximum 365 days
            </p>
          </div>

          {/* Deposit Amount */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2 text-gray-300">Deposit Amount (CELO)</label>
            <input
              type="text"
              value={formData.depositAmount}
              onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
              placeholder="0.1"
            />
            <p className="text-sm text-gray-400 mt-2 font-semibold">
              Both parties deposit this amount. Minimum: 0.01 CELO (~$0.005)
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2 text-gray-300">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
              rows={4}
              placeholder="Add any additional details about the skill exchange..."
              aria-label="Barter Description"
            />
          </div>

          {/* Info Box */}
          <div className="mb-6 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-lg p-6">
            <h4 className="font-black text-lg mb-3 text-white">🔐 How Escrow Works:</h4>
            <ul className="space-y-2 font-semibold text-gray-300">
              <li>✅ Both deposit {formData.depositAmount} CELO to smart contract</li>
              <li>✅ Daily check-ins required (80% minimum)</li>
              <li>✅ Complete all milestones</li>
              <li>✅ Both get deposits back on success</li>
              <li>❌ Fail = lose your deposit</li>
            </ul>
          </div>

          {/* Propose Button */}
          <button
            onClick={handlePropose}
            disabled={!walletConnected || proposing}
            className="w-full px-8 py-4 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg font-black text-2xl text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {proposing ? '⏳ Proposing...' : '🚀 Propose Barter'}
          </button>
        </div>
      </main>
    </div>
  )
}
