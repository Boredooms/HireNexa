'use client'

import { useState, useEffect } from 'react'
import { portfolioNFTService } from '@/lib/web3/portfolio-nft'

interface SharingPermission {
  address: string
  expiresAt: Date
  canView: boolean
  encryptionKey: string
}

interface PortfolioSharingManagerProps {
  tokenId: number
  ownerAddress: string
}

export default function PortfolioSharingManager({ tokenId, ownerAddress }: PortfolioSharingManagerProps) {
  const [permissions, setPermissions] = useState<SharingPermission[]>([])
  const [newShareAddress, setNewShareAddress] = useState('')
  const [shareDuration, setShareDuration] = useState(30) // days
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPermissions()
  }, [tokenId])

  const loadPermissions = async () => {
    try {
      // Get sharing permissions from smart contract
      const contract = portfolioNFTService.getContract()
      if (contract) {
        const perms = await contract.getSharingPermissions(tokenId)
        setPermissions(perms as any)
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    }
  }

  const handleGrantAccess = async () => {
    if (!newShareAddress || !newShareAddress.startsWith('0x')) {
      setMessage('❌ Please enter a valid Ethereum address')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const result = await portfolioNFTService.grantSharingPermission(
        tokenId,
        newShareAddress,
        shareDuration
      )

      setMessage(`✅ Access granted! Transaction: ${result.txHash.substring(0, 10)}...`)
      setNewShareAddress('')
      await loadPermissions()
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeAccess = async (address: string) => {
    setLoading(true)
    setMessage('')

    try {
      const result = await portfolioNFTService.revokeSharingPermission(tokenId, address)
      setMessage(`✅ Access revoked! Transaction: ${result.txHash.substring(0, 10)}...`)
      await loadPermissions()
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const isExpired = (expiresAt: number) => {
    return Date.now() / 1000 > expiresAt
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          🔐 Privacy & Sharing Controls
        </h2>
        <p className="text-gray-600 text-sm">
          Your portfolio NFT #{tokenId} is encrypted. Only you can decide who can view it.
        </p>
      </div>

      {/* Grant Access Section */}
      <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🤝</span> Share Portfolio
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Wallet Address
            </label>
            <input
              type="text"
              value={newShareAddress}
              onChange={(e) => setNewShareAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="share-duration" className="block text-sm font-semibold text-gray-700 mb-2">
              Access Duration
            </label>
            <select
              id="share-duration"
              value={shareDuration}
              onChange={(e) => setShareDuration(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
              title="Select access duration"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days (Recommended)</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
          </div>

          <button
            onClick={handleGrantAccess}
            disabled={loading || !newShareAddress}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <span>🔓</span> Grant Access
              </>
            )}
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.startsWith('✅')
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      {/* Active Permissions */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">👥</span> Active Sharing Permissions
        </h3>

        {permissions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No sharing permissions granted yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Your portfolio is completely private
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {permissions.map((perm, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  !perm.canView || isExpired(perm.expiresAt as any)
                    ? 'bg-gray-50 border-gray-300 opacity-60'
                    : 'bg-white border-green-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {perm.canView && !isExpired(perm.expiresAt as any) ? '✅' : '❌'}
                      </span>
                      <span className="font-mono text-sm text-gray-700">
                        {perm.address.substring(0, 6)}...{perm.address.substring(38)}
                      </span>
                      {!perm.canView && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                          REVOKED
                        </span>
                      )}
                      {isExpired(perm.expiresAt as any) && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full font-semibold">
                          EXPIRED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Expires: {formatDate(perm.expiresAt as any)}
                    </p>
                  </div>

                  {perm.canView && !isExpired(perm.expiresAt as any) && (
                    <button
                      onClick={() => handleRevokeAccess(perm.address)}
                      disabled={loading}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 disabled:opacity-50 transition text-sm"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
          <span>🔒</span> Privacy Notice
        </h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>✓ Your portfolio is encrypted with AES-256-GCM</li>
          <li>✓ Only addresses you approve can decrypt and view</li>
          <li>✓ Permissions automatically expire after the set duration</li>
          <li>✓ You can revoke access at any time</li>
          <li>✓ All sharing actions are recorded on Celo blockchain</li>
        </ul>
      </div>
    </div>
  )
}
