'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { BrowserProvider } from 'ethers'
import { AssignmentEscrowService } from '@/lib/blockchain/assignmentEscrowService'
import Link from 'next/link'
import NetworkChecker from '@/components/NetworkChecker'

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

export default function SubmitSolutionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [blockchainStep, setBlockchainStep] = useState<'form' | 'uploading' | 'blockchain' | 'done'>('form')
  const [assignment, setAssignment] = useState<any>(null)
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    github_pr_url: '',
    github_commit_hash: '',
    submission_notes: '',
  })

  useEffect(() => {
    fetchAssignment()
  }, [params.id])

  const fetchAssignment = async () => {
    const response = await fetch(`/api/assignments/${params.id}`)
    if (response.ok) {
      const data = await response.json()
      setAssignment(data.assignment)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setBlockchainStep('uploading')

    try {
      // Step 1: Upload submission details to IPFS
      const submissionData = {
        assignment_id: params.id,
        github_pr_url: formData.github_pr_url,
        github_commit_hash: formData.github_commit_hash,
        submission_notes: formData.submission_notes,
        submitted_at: new Date().toISOString(),
      }

      // Step 2: Create submission in database
      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: params.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit solution')
      }

      const { submission, submissionURI } = await response.json()
      
      // Store submission ID in case we need to delete it on blockchain failure
      setPendingSubmissionId(submission.id)

      // Step 3: Submit on blockchain - THIS WILL SHOW METAMASK!
      setBlockchainStep('blockchain')

      // Check MetaMask
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to continue')
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new BrowserProvider(window.ethereum)

      // Check network
      const network = await provider.getNetwork()
      if (network.chainId !== BigInt(11142220)) {
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
          }
        }
      }

      // Initialize escrow service
      const escrowService = new AssignmentEscrowService(provider)

      // Submit solution on blockchain
      const { submissionId, txHash } = await escrowService.submitSolution(
        assignment.blockchain_job_id,
        formData.github_pr_url,
        submissionURI
      )

      // Step 4: Update database with blockchain info
      await fetch('/api/assignments/update-submission-blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          blockchainSubmissionId: submissionId,
          blockchainTxHash: txHash,
        }),
      })

      setBlockchainStep('done')
      alert('✅ Solution submitted successfully on blockchain!')
      router.push('/dashboard/assignments')

    } catch (error) {
      console.error('Error submitting solution:', error)
      
      // If blockchain failed but database record was created, offer to delete it
      if (blockchainStep === 'blockchain' && pendingSubmissionId) {
        const shouldDelete = confirm(
          'Blockchain submission failed. Would you like to delete the pending submission so you can try again?\n\n' +
          'Error: ' + (error as Error).message
        )
        
        if (shouldDelete) {
          try {
            const deleteResponse = await fetch(`/api/assignments/delete-submission?id=${pendingSubmissionId}`, {
              method: 'DELETE',
            })
            
            if (deleteResponse.ok) {
              alert('Pending submission deleted. You can try submitting again.')
              setPendingSubmissionId(null)
            } else {
              const deleteError = await deleteResponse.json()
              alert('Failed to delete submission: ' + deleteError.error)
            }
          } catch (deleteError) {
            console.error('Error deleting failed submission:', deleteError)
            alert('Failed to delete submission. Please contact support.')
          }
        }
      } else {
        alert('Failed to submit solution: ' + (error as Error).message)
      }
      
      setBlockchainStep('form')
    } finally {
      setLoading(false)
    }
  }

  if (!assignment) {
    return <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
      <div className="text-xl font-bold">Loading assignment...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      <header className="bg-white shadow border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/assignments/${params.id}`} className="text-gray-600 hover:text-black">
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-black">Submit Solution</h1>
              <p className="text-gray-600">{assignment.title}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Network Checker */}
        <NetworkChecker />
        
        {/* Assignment Info */}
        <div className="bg-white border-2 border-black rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-4">Assignment Details</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Reward</p>
              <p className="font-bold text-[#35D07F]">{assignment.reward_amount} {assignment.reward_currency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Difficulty</p>
              <p className="font-semibold">{assignment.difficulty_level}</p>
            </div>
          </div>
          <p className="text-gray-700">{assignment.description}</p>
          {assignment.github_repo_url && (
            <div className="mt-4">
              <a
                href={assignment.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                📁 View Repository →
              </a>
            </div>
          )}
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white border-2 border-black rounded-lg p-6">
          <h2 className="text-xl font-bold text-black mb-6">Your Solution</h2>

          {/* GitHub PR URL */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">
              GitHub Pull Request URL *
            </label>
            <input
              type="url"
              required
              value={formData.github_pr_url}
              onChange={(e) => setFormData({ ...formData, github_pr_url: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="https://github.com/owner/repo/pull/123"
            />
            <p className="text-xs text-gray-500 mt-1">
              Link to your pull request with the solution
            </p>
          </div>

          {/* Commit Hash */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">
              Commit Hash (Optional)
            </label>
            <input
              type="text"
              value={formData.github_commit_hash}
              onChange={(e) => setFormData({ ...formData, github_commit_hash: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="abc123def456..."
            />
          </div>

          {/* Submission Notes */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">
              Submission Notes
            </label>
            <textarea
              value={formData.submission_notes}
              onChange={(e) => setFormData({ ...formData, submission_notes: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded h-32"
              placeholder="Describe your solution, challenges faced, testing done..."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 font-semibold mb-2">
              🔐 Blockchain Submission
            </p>
            <p className="text-sm text-blue-700">
              Your submission will be recorded on Celo Sepolia blockchain. MetaMask will popup to confirm the transaction.
              {assignment.auto_verify && ' This assignment has auto-verification enabled - you may receive instant approval!'}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#35D07F] text-white font-bold rounded border-2 border-black hover:bg-[#2ab56f] transition disabled:opacity-50"
            >
              {blockchainStep === 'uploading' && '📤 Uploading to IPFS...'}
              {blockchainStep === 'blockchain' && '🔐 Waiting for MetaMask...'}
              {blockchainStep === 'done' && '✅ Submitted!'}
              {blockchainStep === 'form' && !loading && '🚀 Submit Solution'}
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
