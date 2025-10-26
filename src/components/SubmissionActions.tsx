'use client'

import { useState } from 'react'
import { BrowserProvider } from 'ethers'
import { AssignmentEscrowService } from '@/lib/blockchain/assignmentEscrowService'

interface SubmissionActionsProps {
  submissionId: string
  blockchainSubmissionId: number
  assignmentId: string
  candidateId: string
  candidateName: string
}

export function SubmissionActions({
  submissionId,
  blockchainSubmissionId,
  assignmentId,
  candidateId,
  candidateName,
}: SubmissionActionsProps) {
  const [processing, setProcessing] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = async () => {
    if (!confirm(`Approve submission from ${candidateName}?\n\nThis will:\n1. Pay reward from escrow\n2. Mint NFT certificate\n3. Send to student's wallet`)) {
      return
    }

    setProcessing(true)
    setAction('approve')

    try {
      // Step 1: Check MetaMask
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      // Step 2: Connect to blockchain
      const provider = new BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const escrowService = new AssignmentEscrowService(provider)

      console.log('📝 Approving submission on blockchain...')
      console.log('Blockchain submission ID:', blockchainSubmissionId)
      
      // Step 3: Update verification status (auto-approves if score >= 90)
      console.log('Updating verification status (will auto-approve)...')
      const txHash = await escrowService.updateVerification(blockchainSubmissionId, 95, true)
      console.log('✅ Verification updated and auto-approved! Reward paid!')
      console.log('Transaction hash:', txHash)

      // Step 4: Mint NFT certificate
      console.log('🏆 Minting NFT certificate...')
      const { tokenId, txHash: certTxHash } = await escrowService.mintCertificate(blockchainSubmissionId)
      console.log('✅ Certificate minted! Token ID:', tokenId)
      console.log('Certificate transaction:', certTxHash)

      // Step 5: Update database
      const response = await fetch('/api/assignments/approve-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          assignmentId,
          candidateId,
          txHash,
          certificateTokenId: tokenId,
          certificateTxHash: certTxHash,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update database')
      }

      alert('✅ Submission approved! Reward paid and certificate minted!')
      window.location.reload()
    } catch (error: any) {
      console.error('Error approving submission:', error)
      alert('Failed to approve submission: ' + error.message)
    } finally {
      setProcessing(false)
      setAction(null)
    }
  }

  const handleReject = async () => {
    if (!confirm(`Reject submission from ${candidateName}?`)) {
      return
    }

    setProcessing(true)
    setAction('reject')

    try {
      const response = await fetch('/api/assignments/reject-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject submission')
      }

      alert('Submission rejected')
      window.location.reload()
    } catch (error: any) {
      console.error('Error rejecting submission:', error)
      alert('Failed to reject submission: ' + error.message)
    } finally {
      setProcessing(false)
      setAction(null)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={processing}
        className="px-4 py-2 bg-[#35D07F] text-white font-bold rounded border-2 border-black hover:bg-[#2ab56f] transition disabled:opacity-50"
      >
        {processing && action === 'approve' ? '⏳ Approving...' : '✅ Approve & Pay'}
      </button>
      <button
        onClick={handleReject}
        disabled={processing}
        className="px-4 py-2 bg-red-500 text-white font-bold rounded border-2 border-black hover:bg-red-600 transition disabled:opacity-50"
      >
        {processing && action === 'reject' ? '⏳ Rejecting...' : '❌ Reject'}
      </button>
    </div>
  )
}
