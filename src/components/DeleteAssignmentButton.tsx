'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteAssignmentButton({ assignmentId }: { assignmentId: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    console.log('Delete button clicked for assignment:', assignmentId)
    
    if (!confirm('Are you sure you want to delete this assignment? This cannot be undone.')) {
      console.log('User cancelled deletion')
      return
    }

    console.log('User confirmed deletion, proceeding...')
    setDeleting(true)
    
    try {
      console.log('Sending DELETE request to:', `/api/assignments/delete?id=${assignmentId}`)
      const response = await fetch(`/api/assignments/delete?id=${assignmentId}`, {
        method: 'DELETE',
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Delete API error:', error)
        throw new Error(error.error || 'Failed to delete assignment')
      }

      const result = await response.json()
      console.log('Delete successful:', result)
      
      alert('Assignment deleted successfully!')
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment: ' + error.message)
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-4 py-2 bg-red-500 text-white font-bold rounded border-2 border-black hover:bg-red-600 transition disabled:opacity-50"
    >
      {deleting ? '🗑️ Deleting...' : '🗑️ Delete'}
    </button>
  )
}
