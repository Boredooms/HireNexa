'use client'

import { useState, useEffect } from 'react'

export default function WalletConnect() {
  const [address, setAddress] = useState<string>('')
  const [balance, setBalance] = useState<string>('0')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chainId, setChainId] = useState<string>('')

  const connectWallet = async () => {
    setLoading(true)
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to use Celo features!')
        setLoading(false)
        return
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const userAddress = accounts[0]
      setAddress(userAddress)
      setConnected(true)

      // Get current chain ID
      const currentChainId = await window.ethereum.request({
        method: 'eth_chainId',
      })
      setChainId(currentChainId)

      // Get balance using eth_getBalance
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [userAddress, 'latest'],
      })

      // Convert hex balance to decimal CELO
      const balanceWei = parseInt(balanceHex, 16)
      const balanceCelo = balanceWei / 1e18
      setBalance(balanceCelo.toFixed(4))

      // 💾 SAVE WALLET ADDRESS TO DATABASE
      console.log(`💾 Saving wallet address to database: ${userAddress}`)
      try {
        const response = await fetch('/api/user/save-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: userAddress }),
        })

        if (response.ok) {
          console.log('✅ Wallet address saved to database')
        } else {
          console.error('❌ Failed to save wallet address')
        }
      } catch (saveError) {
        console.error('Error saving wallet address:', saveError)
        // Don't fail the connection if saving fails
      }

    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      alert(`Failed to connect wallet: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = () => {
    setAddress('')
    setBalance('0')
    setConnected(false)
  }

  // Auto-connect if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts && accounts.length > 0) {
            connectWallet()
          }
        } catch (error) {
          console.error('Error checking connection:', error)
        }
      }
    }
    checkConnection()
  }, [])

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <div>
            <h3 className="font-bold text-white">Celo Wallet</h3>
            <p className="text-xs text-gray-400">
              {chainId === '0xaa044c' ? 'Sepolia ⭐' : chainId === '0xa4ec' ? 'Mainnet' : chainId === '0xaef3' ? 'Alfajores' : 'Not Connected'}
            </p>
          </div>
        </div>
        
        {connected && (
          <div className="text-right">
            <p className="text-sm text-gray-400">Balance</p>
            <p className="text-xl font-bold text-green-400">{balance} CELO</p>
          </div>
        )}
      </div>

      {!connected ? (
        <button
          onClick={connectWallet}
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-yellow-400 to-green-500 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-white/10 rounded-lg border border-white/20">
            <p className="text-xs text-gray-400 mb-1">Connected Address</p>
            <p className="font-mono text-sm text-white break-all">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
          
          <button
            onClick={disconnectWallet}
            className="w-full px-6 py-2 border border-white/20 text-gray-300 rounded-lg font-semibold hover:bg-white/10 transition"
          >
            Disconnect
          </button>
        </div>
      )}

      {!connected && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300">
            💡 <strong>Tip:</strong> Click "Sepolia Testnet ⭐" button below to add Celo Sepolia network to MetaMask, then connect your wallet.
          </p>
        </div>
      )}
    </div>
  )
}
