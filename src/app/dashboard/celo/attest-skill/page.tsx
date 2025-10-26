'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AttestSkillPage() {
  const router = useRouter()
  const [skillName, setSkillName] = useState('')
  const [confidenceScore, setConfidenceScore] = useState(85)
  const [evidence, setEvidence] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleAttest = async () => {
    if (!skillName) {
      alert('Please enter a skill name')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/skills/attest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName,
          confidenceScore,
          evidence,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to attest skill')
      }

      setResult(data)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/celo" className="text-indigo-600 hover:text-indigo-700">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Attest Skill on Blockchain</h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!result ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Attest Your Skill
              </h2>
              <p className="text-gray-600">
                Create a tamper-proof, blockchain-verified skill attestation
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Name *
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g., React, Python, Solidity"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Score: {confidenceScore}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceScore}
                  onChange={(e) => setConfidenceScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  title="Confidence Score Slider"
                  aria-label="Confidence Score Slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Expert</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence (IPFS Hash or URL)
                </label>
                <textarea
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="QmXxx... or https://..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleAttest}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
              >
                {loading ? 'Attesting on Blockchain...' : '🔐 Attest Skill on Blockchain'}
              </button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">What happens?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✓ Skill data is encrypted and hashed</li>
                <li>✓ Transaction signed with your wallet</li>
                <li>✓ Stored permanently on Celo blockchain</li>
                <li>✓ Evidence uploaded to IPFS (if provided)</li>
                <li>✓ Tamper-proof and verifiable forever</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-green-900 mb-2">
                Skill Attested Successfully!
              </h2>
              <p className="text-gray-600">
                Your skill is now verified on the Celo blockchain
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Transaction Hash</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {result.transactionHash}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Skill ID</p>
                <p className="font-mono text-sm text-gray-900">
                  {result.skillId}
                </p>
              </div>

              <a
                href={`https://celo-sepolia.blockscout.com/tx/${result.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-center"
              >
                View on Blockchain Explorer →
              </a>

              <button
                onClick={() => router.push('/dashboard/celo')}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
