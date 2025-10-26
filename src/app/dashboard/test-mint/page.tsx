'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function TestMintPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleReset = async () => {
    if (!confirm('⚠️ This will delete your old portfolio NFT record. Continue?')) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/portfolio/reset', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset')
      }

      setMessage('✅ Portfolio reset! Now go sync GitHub to test new minting flow.')
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Test NFT Minting</h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🧪</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Test New NFT Minting Flow
            </h2>
            <p className="text-gray-600">
              Reset your portfolio to test the user-pays-gas minting system
            </p>
          </div>

          <div className="space-y-6">
            {/* Current Status */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Current Status</h3>
              <p className="text-sm text-blue-700">
                You have NFT #3 (minted with old backend-pays-gas system)
              </p>
            </div>

            {/* What This Does */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ What This Does</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Deletes your old portfolio NFT record from database</li>
                <li>• Allows you to test the new minting flow</li>
                <li>• You'll mint NFT #4 using MetaMask (you pay gas)</li>
                <li>• NFT will be in YOUR wallet (not backend wallet)</li>
              </ul>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition"
            >
              {loading ? '⏳ Resetting...' : '🗑️ Reset Portfolio & Test New Minting'}
            </button>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {/* Next Steps */}
            {message.includes('✅') && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">🎉 Next Steps:</h3>
                <ol className="text-sm text-green-700 space-y-2 list-decimal list-inside">
                  <li>Go to <Link href="/dashboard/github" className="underline font-semibold">GitHub Sync</Link></li>
                  <li>Enter your GitHub username</li>
                  <li>Click "Sync Repositories"</li>
                  <li>You'll see "Mint Portfolio NFT" button</li>
                  <li>Click it → MetaMask popup appears</li>
                  <li>Approve transaction (you pay ~0.0001 CELO)</li>
                  <li>NFT #4 minted to YOUR wallet! 🎉</li>
                </ol>
              </div>
            )}

            {/* Testing Checklist */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">✅ Testing Checklist</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>□ Reset portfolio (click button above)</li>
                <li>□ Sync GitHub</li>
                <li>□ See "Mint Portfolio NFT" button</li>
                <li>□ Click mint button</li>
                <li>□ MetaMask popup appears</li>
                <li>□ Approve transaction</li>
                <li>□ NFT minted successfully</li>
                <li>□ Check dashboard - NFT Credentials shows 1</li>
                <li>□ Import NFT in MetaMask</li>
                <li>□ See NFT in MetaMask NFTs tab</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
