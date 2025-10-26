'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { BrowserProvider } from 'ethers'
import { AssignmentEscrowService } from '@/lib/blockchain/assignmentEscrowService'

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

export default function PostAssignmentPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [blockchainStep, setBlockchainStep] = useState<'form' | 'uploading' | 'blockchain' | 'done'>('form')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company_name: '',
    assignment_type: 'bug_fix',
    difficulty_level: 'intermediate',
    estimated_hours: '',
    reward_amount: '',
    required_skills: '',
    github_repo_url: '',
    github_issue_url: '',
    max_submissions: '3',
    auto_verify: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setBlockchainStep('uploading')

    let createdAssignmentId: string | null = null

    try {
      // Step 1: Create assignment in database first
      const response = await fetch('/api/assignments/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimated_hours: parseInt(formData.estimated_hours) || 0,
          reward_amount: parseFloat(formData.reward_amount) || 0,
          max_submissions: parseInt(formData.max_submissions) || 3,
          required_skills: formData.required_skills.split(',').map((s) => s.trim()),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to post assignment')
      }

      const { assignment, metadataIpfs } = await response.json()
      createdAssignmentId = assignment.id

      // Step 2: Create escrow on blockchain - THIS WILL SHOW METAMASK!
      setBlockchainStep('blockchain')
      
      // Check MetaMask
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to continue')
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      // Create provider
      const provider = new BrowserProvider(window.ethereum)

      // Check network (Celo Sepolia)
      const network = await provider.getNetwork()
      if (network.chainId !== BigInt(11142220)) {
        // Switch to Celo Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa0dc' }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa0dc',
                chainName: 'Celo Sepolia Testnet',
                nativeCurrency: { name: 'S-CELO', symbol: 'S-CELO', decimals: 18 },
                rpcUrls: ['https://forno.celo-sepolia.celo-testnet.org'],
                blockExplorerUrls: ['https://celo-sepolia.blockscout.com']
              }]
            })
          } else {
            throw switchError
          }
        }
      }

      // Initialize escrow service
      const escrowService = new AssignmentEscrowService(provider)

      // Create assignment on blockchain with escrow
      const { assignmentId, txHash } = await escrowService.createAssignment(
        formData.title,
        metadataIpfs,
        formData.reward_amount,
        parseInt(formData.max_submissions) || 3,
        formData.auto_verify,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
      )

      // Step 3: Update database with blockchain info
      await fetch('/api/assignments/update-blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          blockchainAssignmentId: assignmentId,
          blockchainTxHash: txHash,
        }),
      })

      setBlockchainStep('done')
      alert('✅ Assignment posted successfully with blockchain escrow!')
      router.push('/dashboard/recruiter')
      
    } catch (error) {
      console.error('Error posting assignment:', error)
      
      // If blockchain failed but database record was created, delete it
      if (createdAssignmentId && blockchainStep === 'blockchain') {
        console.log('Blockchain failed, cleaning up database record...')
        try {
          await fetch(`/api/assignments/delete?id=${createdAssignmentId}`, {
            method: 'DELETE',
          })
          console.log('Database record cleaned up')
          alert(
            'Blockchain transaction failed. The assignment was not created.\n\n' +
            'Error: ' + (error as Error).message + '\n\n' +
            'Please make sure you:\n' +
            '1. Have enough CELO for escrow (reward × max_submissions)\n' +
            '2. Are connected to Celo Sepolia Testnet\n' +
            '3. Approve the transaction in MetaMask'
          )
        } catch (deleteError) {
          console.error('Error cleaning up:', deleteError)
          alert(
            'Blockchain transaction failed AND cleanup failed.\n\n' +
            'Please manually delete the assignment from the recruiter dashboard.\n\n' +
            'Error: ' + (error as Error).message
          )
        }
      } else {
        alert('Failed to create assignment: ' + (error as Error).message)
      }
      
      setBlockchainStep('form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      <header className="bg-white shadow border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-black">📋 Post a New Assignment</h1>
          <p className="text-gray-600">Create a micro-task for students to complete</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white border-2 border-black rounded-lg p-8">
          {/* Assignment Title */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">Assignment Title *</label>
            <input
              type="text"
              required
              minLength={5}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="e.g. Fix authentication bug in login component"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 5 characters</p>
          </div>

          {/* Company Name */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">Company Name *</label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="Your Company"
            />
          </div>

          {/* Assignment Type & Difficulty */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Assignment Type *</label>
              <select
                value={formData.assignment_type}
                onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded"
                aria-label="Assignment Type"
              >
                <option value="bug_fix">🐛 Bug Fix</option>
                <option value="feature_implementation">✨ Feature Implementation</option>
                <option value="code_review">👀 Code Review</option>
                <option value="documentation">📝 Documentation</option>
                <option value="testing">🧪 Testing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Difficulty Level *</label>
              <select
                value={formData.difficulty_level}
                onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded"
                aria-label="Difficulty Level"
              >
                <option value="beginner">🟢 Beginner</option>
                <option value="intermediate">🔵 Intermediate</option>
                <option value="advanced">🟠 Advanced</option>
                <option value="expert">🔴 Expert</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">Assignment Description *</label>
            <textarea
              required
              minLength={20}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded h-32"
              placeholder="Describe the task, what needs to be done, acceptance criteria..."
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 20 characters</p>
          </div>

          {/* GitHub URLs */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">GitHub Repository URL</label>
            <input
              type="url"
              value={formData.github_repo_url}
              onChange={(e) => setFormData({ ...formData, github_repo_url: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded mb-3"
              placeholder="https://github.com/username/repo"
            />
            
            <label className="block text-sm font-bold text-black mb-2">GitHub Issue URL (Optional)</label>
            <input
              type="url"
              value={formData.github_issue_url}
              onChange={(e) => setFormData({ ...formData, github_issue_url: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="https://github.com/username/repo/issues/123"
            />
          </div>

          {/* Estimated Hours & Reward */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Estimated Hours *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded"
                placeholder="8"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Reward (CELO) *</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.reward_amount}
                onChange={(e) => setFormData({ ...formData, reward_amount: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded"
                placeholder="10.00"
              />
            </div>
          </div>

          {/* Required Skills */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">
              Required Skills * (comma-separated)
            </label>
            <input
              type="text"
              required
              value={formData.required_skills}
              onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="React, TypeScript, Testing, Git"
            />
          </div>

          {/* Max Submissions */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">Maximum Submissions</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.max_submissions}
              onChange={(e) => setFormData({ ...formData, max_submissions: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="3"
            />
            <p className="text-xs text-gray-500 mt-1">How many students can submit solutions (1-10)</p>
          </div>

          {/* Auto-Verify */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auto_verify}
                onChange={(e) => setFormData({ ...formData, auto_verify: e.target.checked })}
                className="w-5 h-5 border-2 border-black rounded"
              />
              <span className="text-sm font-bold text-black">
                ⚡ Enable Auto-Verification
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              Automatically approve submissions that pass all GitHub checks and AI verification (score ≥ 90%)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#FCFF52] text-black font-bold rounded border-2 border-black hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {blockchainStep === 'uploading' && '📤 Uploading to IPFS...'}
              {blockchainStep === 'blockchain' && '🔐 Waiting for MetaMask...'}
              {blockchainStep === 'done' && '✅ Posted!'}
              {blockchainStep === 'form' && !loading && '🚀 Post Assignment with Escrow'}
              {blockchainStep === 'form' && loading && 'Processing...'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-white text-black font-bold rounded border-2 border-black hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
