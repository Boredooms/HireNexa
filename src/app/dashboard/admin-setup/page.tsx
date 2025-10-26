'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const makeAdmin = async () => {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/debug/make-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ Success! ${data.message}`)
        setTimeout(() => {
          window.location.href = '/dashboard/admin'
        }, 2000)
      } else {
        setError(`❌ Error: ${data.error}`)
      }
    } catch (err: any) {
      setError(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <header className="bg-white shadow border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-black">Admin Setup</h1>
          <p className="text-gray-600 mt-2">Make yourself an admin to access the admin dashboard</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border-2 border-black rounded-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-6">🛡️</div>
            <h2 className="text-2xl font-bold text-black mb-4">Become an Admin</h2>
            <p className="text-gray-600 mb-8">
              Click the button below to set your account as an admin. This will allow you to:
            </p>

            <ul className="text-left max-w-md mx-auto mb-8 space-y-3">
              <li className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <span className="text-gray-700">View recruiter applications</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <span className="text-gray-700">Approve/reject recruiters</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <span className="text-gray-700">View peer reviewer applications</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <span className="text-gray-700">Access admin dashboard</span>
              </li>
            </ul>

            {error && (
              <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg mb-6">
                <p className="text-red-700 font-bold">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg mb-6">
                <p className="text-green-700 font-bold">{message}</p>
                <p className="text-sm text-green-600 mt-2">Redirecting to admin dashboard...</p>
              </div>
            )}

            <button
              onClick={makeAdmin}
              disabled={loading}
              className="px-8 py-4 bg-[#35D07F] text-white font-bold rounded border-2 border-black hover:bg-[#2ab56f] disabled:opacity-50 transition text-lg"
            >
              {loading ? '⏳ Setting up...' : '🛡️ Make Me Admin'}
            </button>

            <p className="text-sm text-gray-600 mt-6">
              After clicking the button, you'll be redirected to the admin dashboard.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
