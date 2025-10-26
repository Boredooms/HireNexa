'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function IssueCredentialPage() {
  const router = useRouter()
  const [credentialType, setCredentialType] = useState('certificate')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleIssue = async () => {
    if (!title || !recipientAddress) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/credentials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialType,
          title,
          description,
          recipientAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to issue credential')
      }

      setResult(data)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/celo" className="text-purple-600 hover:text-purple-700">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Issue NFT Credential</h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!result ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎓</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Issue NFT Credential
              </h2>
              <p className="text-gray-600">
                Create a tamper-proof, blockchain-verified credential as an NFT
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="credential-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Credential Type *
                </label>
                <select
                  id="credential-type"
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  title="Select Credential Type"
                  aria-label="Credential Type"
                >
                  <option value="certificate">Certificate</option>
                  <option value="badge">Badge</option>
                  <option value="diploma">Diploma</option>
                  <option value="license">License</option>
                  <option value="achievement">Achievement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Full Stack Developer Certificate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this credential represents..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Wallet Address *
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <button
                onClick={handleIssue}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
              >
                {loading ? 'Minting NFT Credential...' : '🎓 Issue NFT Credential'}
              </button>
            </div>

            <div className="mt-8 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">🔐 Security Features:</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>✓ End-to-end encryption of credential data</li>
                <li>✓ ERC-721 NFT standard on Celo blockchain</li>
                <li>✓ Metadata stored on IPFS (immutable)</li>
                <li>✓ Cryptographic signatures for verification</li>
                <li>✓ Revocation capability for issuers</li>
                <li>✓ Shareable with time-limited access tokens</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-purple-900 mb-2">
                NFT Credential Issued!
              </h2>
              <p className="text-gray-600">
                The credential has been minted as an NFT on Celo blockchain
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">NFT Token ID</p>
                <p className="font-mono text-xl font-bold text-purple-600">
                  #{result.tokenId}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Transaction Hash</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {result.transactionHash}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">IPFS Metadata</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {result.ipfsHash}
                </p>
              </div>

              <a
                href={`https://celo-sepolia.blockscout.com/tx/${result.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-center"
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
