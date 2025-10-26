'use client'

import { useState } from 'react'

export default function CleanupPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const fixPendingAssignments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/fix-pending-assignments', {
        method: 'POST',
      })
      const data = await response.json()
      setResults({ action: 'Fix Pending Assignments', ...data })
    } catch (error: any) {
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const cleanupFailedSubmissions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/cleanup-failed-submissions', {
        method: 'POST',
      })
      const data = await response.json()
      setResults({ action: 'Cleanup Failed Submissions', ...data })
    } catch (error: any) {
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const runDiagnostic = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/full-diagnostic')
      const data = await response.json()
      setResults({ action: 'Full Diagnostic', ...data })
    } catch (error: any) {
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Database Cleanup Tools</h1>

        <div className="space-y-4 mb-8">
          <button
            onClick={fixPendingAssignments}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-500 text-white font-bold rounded border-2 border-black hover:bg-blue-600 disabled:opacity-50"
          >
            1. Fix Pending Assignments
          </button>

          <button
            onClick={cleanupFailedSubmissions}
            disabled={loading}
            className="w-full px-6 py-3 bg-red-500 text-white font-bold rounded border-2 border-black hover:bg-red-600 disabled:opacity-50"
          >
            2. Cleanup Failed Submissions
          </button>

          <button
            onClick={runDiagnostic}
            disabled={loading}
            className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded border-2 border-black hover:bg-green-600 disabled:opacity-50"
          >
            3. Run Full Diagnostic
          </button>

          <button
            onClick={async () => {
              setLoading(true)
              try {
                const response = await fetch('/api/debug/check-db-status')
                const data = await response.json()
                setResults({ action: 'Database Status Check', ...data })
              } catch (error: any) {
                setResults({ error: error.message })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-500 text-white font-bold rounded border-2 border-black hover:bg-purple-600 disabled:opacity-50"
          >
            4. Check Database Status (Direct)
          </button>

          <button
            onClick={async () => {
              if (!confirm('This will delete all assignments that don\'t exist on blockchain (like ID 10+). Continue?')) return
              setLoading(true)
              try {
                const response = await fetch('/api/debug/delete-orphaned-assignments', {
                  method: 'POST',
                })
                const data = await response.json()
                setResults({ action: 'Delete Orphaned Assignments', ...data })
              } catch (error: any) {
                setResults({ error: error.message })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full px-6 py-3 bg-orange-500 text-white font-bold rounded border-2 border-black hover:bg-orange-600 disabled:opacity-50"
          >
            5. Delete Orphaned Assignments (ID 10+)
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="text-xl">Loading...</div>
          </div>
        )}

        {results && (
          <div className="bg-white border-2 border-black rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Results:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
