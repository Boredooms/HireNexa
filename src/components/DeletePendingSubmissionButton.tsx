'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  submissionId: string
  hasBlockchainId: boolean
}

export default function DeletePendingSubmissionButton({ submissionId, hasBlockchainId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Only show button if submission doesn't have blockchain ID (failed submission)
  if (hasBlockchainId) {
    return null
  }

  const handleDelete = async () => {
    if (!confirm('This submission failed to record on blockchain. Delete it so you can try again?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/assignments/delete-submission?id=${submissionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete submission')
      }

      alert('✅ Pending submission deleted! You can now submit again.')
      router.refresh()
    } catch (error: any) {
      alert('Failed to delete: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded border-2 border-black hover:bg-red-600 disabled:opacity-50"
    >
      {loading ? 'Deleting...' : '🗑️ Delete Failed Submission'}
    </button>
  )
}
