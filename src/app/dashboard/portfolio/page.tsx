'use client'

import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import VisualPortfolioDisplay from '@/components/portfolio/VisualPortfolioDisplay'
import { ArrowLeft, Package, CheckCircle, AlertCircle } from 'lucide-react'

export default function GeneratePortfolioPage() {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [portfolio, setPortfolio] = useState<any>(null)

  // Auto-load portfolio on mount
  useEffect(() => {
    loadPortfolio()
  }, [])

  const loadPortfolio = async () => {
    try {
      const response = await fetch('/api/portfolio/view')
      const data = await response.json()

      if (response.ok && data.portfolio) {
        setPortfolio(data.portfolio)
      }
    } catch (err) {
      console.error('Error loading portfolio:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/portfolio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate portfolio')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-300 font-semibold flex items-center gap-1 transition">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-2xl font-bold text-white">Generate Portfolio</h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="inline-block mb-4 p-3 bg-[#3B82F6]/20 rounded-lg">
              <Package className="w-8 h-8 text-[#3B82F6]" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Generate Your Portfolio
            </h2>
            <p className="text-gray-400">
              Create a decentralized portfolio hosted on IPFS
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading your portfolio...</p>
            </div>
          ) : portfolio ? (
            <>
              <VisualPortfolioDisplay portfolio={portfolio} />
              
              {/* Regenerate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#3B82F6]/50 disabled:opacity-50 disabled:cursor-not-allowed transition mt-4"
              >
                🔄 Regenerate Portfolio
              </button>
            </>
          ) : (
            <>
              <div className="text-center py-8">
                <p className="text-gray-400 mb-6">No portfolio found. Connect your GitHub to generate one!</p>
                <Link
                  href="/dashboard/github"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
                >
                  Connect GitHub
                </Link>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="font-semibold text-blue-300 mb-2">Your portfolio will include:</h4>
                <ul className="text-sm text-blue-400 space-y-1">
                  <li>✓ Professional profile and bio</li>
                  <li>✓ Verified skills with confidence scores</li>
                  <li>✓ GitHub projects and contributions</li>
                  <li>✓ Blockchain credentials (NFTs)</li>
                  <li>✓ Immutable IPFS storage</li>
                </ul>
              </div>
            </>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-6 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg flex gap-3">
                <CheckCircle className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#3B82F6] mb-2 text-lg">Portfolio Generated!</h3>
                  <p className="text-[#3B82F6]/80 mb-4 text-sm">
                    Your portfolio has been uploaded to IPFS
                  </p>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-400">IPFS Hash:</p>
                      <p className="font-mono text-xs bg-white/5 p-2 rounded border border-white/10 text-gray-300 mt-1">
                        {result.ipfsHash}
                      </p>
                    </div>
                    
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm mt-2"
                    >
                      View Portfolio on IPFS →
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setResult(null)}
                className="w-full px-6 py-3 border border-white/20 text-gray-300 rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Generate New Portfolio
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
