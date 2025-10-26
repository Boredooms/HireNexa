'use client'

import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { MintNFTButton } from '@/components/portfolio/MintNFTButton'
import { SyncingAnimation } from '@/components/github/SyncingAnimation'
import { ArrowLeft, Github, CheckCircle, AlertCircle } from 'lucide-react'

export default function GitHubConnectPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [connectedGitHub, setConnectedGitHub] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showMintButton, setShowMintButton] = useState(false)

  // Check if user has connected GitHub account
  useEffect(() => {
    checkGitHubConnection()
  }, [])

  const checkGitHubConnection = async () => {
    try {
      const response = await fetch('/api/github/check-connection')
      const data = await response.json()
      if (data.connected) {
        setConnectedGitHub(data.username)
        setUsername(data.username)
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error)
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const handleGitHubOAuth = () => {
    // Redirect to GitHub OAuth
    window.location.href = '/api/auth/github'
  }

  const handleConnect = async () => {
    if (!username) {
      setError('Please enter a GitHub username')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Extract username from URL if full URL is provided
      let githubUsername = username.trim()
      
      // Handle full GitHub URL: https://github.com/username
      if (githubUsername.includes('github.com/')) {
        const parts = githubUsername.split('github.com/')
        githubUsername = parts[1]?.split('/')[0] || ''
      }
      
      // Remove any trailing slashes or special characters
      githubUsername = githubUsername.replace(/[^a-zA-Z0-9-]/g, '')
      
      if (!githubUsername) {
        setError('Invalid GitHub username or URL')
        setLoading(false)
        return
      }

      console.log('📝 Extracted GitHub username:', githubUsername)

      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUsername }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync GitHub')
      }

      setResult(data)
      
      // Check if NFT minting is required
      if (data.requiresMinting && data.nftMetadataHash) {
        setShowMintButton(true)
      } else {
        // Automatically redirect to portfolio page if no minting needed
        setTimeout(() => {
          window.location.href = '/dashboard/portfolio'
        }, 2000)
      }
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
            <h1 className="text-2xl font-bold text-white">Connect GitHub</h1>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="inline-block mb-4 p-3 bg-[#3B82F6]/20 rounded-lg">
              <Github className="w-8 h-8 text-[#3B82F6]" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Connect Your GitHub
            </h2>
            <p className="text-gray-400">
              We'll analyze your repositories and verify your skills using AI
            </p>
          </div>

          <div className="space-y-4">
            {!connectedGitHub ? (
              // Show GitHub OAuth button if not connected
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-300">
                    <strong>Secure Authentication:</strong> Connect your GitHub account once. This prevents unauthorized access and ensures only YOUR repositories are analyzed.
                  </p>
                </div>
                
                <button
                  onClick={handleGitHubOAuth}
                  disabled={isCheckingAuth}
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#3B82F6]/50 transition flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Github className="w-5 h-5" />
                  Connect with GitHub
                </button>

                <p className="text-xs text-gray-400 text-center">
                  We'll only access your public repositories. Your data is encrypted and stored securely.
                </p>
              </div>
            ) : (
              // Show sync button if already connected
              <div className="space-y-4">
                <div className="p-4 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg flex gap-3">
                  <CheckCircle className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#3B82F6]">
                    <strong>Connected:</strong> @{connectedGitHub}
                  </p>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#3B82F6]/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? '⏳ Syncing...' : '🚀 Sync Repositories'}
                </button>
              </div>
            )}

            {/* Syncing Animation */}
            {loading && (
              <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                <SyncingAnimation />
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg flex gap-3">
                  <CheckCircle className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-[#3B82F6] mb-1">Success!</h3>
                    <p className="text-[#3B82F6]/80 text-sm mb-2">
                      Portfolio generated and uploaded to IPFS
                    </p>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#60A5FA] hover:text-[#93C5FD] underline text-sm"
                    >
                      View on IPFS →
                    </a>
                  </div>
                </div>

                {/* Show Mint NFT Button if required */}
                {showMintButton && result.nftMetadataHash && (
                  <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-2">🎨 Mint Your Portfolio NFT</h3>
                    <p className="text-gray-400 mb-4 text-sm">
                      Your portfolio is ready! Mint it as an NFT on the Celo blockchain.
                    </p>
                    <MintNFTButton
                      metadataIpfsHash={result.nftMetadataHash}
                      onSuccess={(tokenId, txHash) => {
                        console.log('✅ NFT minted successfully!', { tokenId, txHash })
                        // Redirect to portfolio after successful mint
                        setTimeout(() => {
                          window.location.href = '/dashboard/portfolio'
                        }, 3000)
                      }}
                      onError={(error) => {
                        console.error('❌ NFT mint failed:', error)
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="font-semibold text-blue-300 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-400 space-y-1">
              <li>✓ We fetch your public repositories</li>
              <li>✓ AI analyzes your code and extracts skills</li>
              <li>✓ Skills are verified and scored</li>
              <li>✓ Portfolio is generated and uploaded to IPFS</li>
              <li>✓ You can mint blockchain credentials</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
