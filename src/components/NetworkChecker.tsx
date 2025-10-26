'use client'

import { useEffect, useState } from 'react'

export default function NetworkChecker() {
  const [network, setNetwork] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkNetwork()
  }, [])

  const checkNetwork = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask not installed')
        return
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      const chainIdDecimal = parseInt(chainId, 16)

      const networks: any = {
        11142220: { name: 'Celo Sepolia', correct: true, color: 'green' },
        44787: { name: 'Alfajores', correct: false, color: 'red' },
        42220: { name: 'Celo Mainnet', correct: false, color: 'red' },
      }

      const currentNetwork = networks[chainIdDecimal] || {
        name: `Unknown (${chainIdDecimal})`,
        correct: false,
        color: 'red'
      }

      setNetwork({ chainId: chainIdDecimal, ...currentNetwork })
    } catch (error: any) {
      setError(error.message)
    }
  }

  const switchNetwork = async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed')
      return
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa0dc' }], // 11142220 in hex
      })
      checkNetwork()
    } catch (switchError: any) {
      if (switchError.code === 4902 && window.ethereum) {
        // Network not added, add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa0dc',
              chainName: 'Celo Sepolia Testnet',
              nativeCurrency: { name: 'S-CELO', symbol: 'S-CELO', decimals: 18 },
              rpcUrls: ['https://forno.celo-sepolia.celo-testnet.org'],
              blockExplorerUrls: ['https://celo-sepolia.blockscout.com']
            }]
          })
          checkNetwork()
        } catch (addError: any) {
          setError('Failed to add network: ' + addError.message)
        }
      } else {
        setError('Failed to switch network: ' + switchError.message)
      }
    }
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 backdrop-blur-sm">
        <p className="text-red-400 font-bold">❌ Network Error</p>
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    )
  }

  if (!network) {
    return (
      <div className="bg-white/5 border border-white/20 rounded-lg p-4 mb-4 backdrop-blur-sm">
        <p className="text-gray-300">Checking network...</p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg p-4 mb-4 backdrop-blur-sm border ${
      network.correct 
        ? 'bg-gradient-to-r from-[#35D07F]/20 to-[#2ab56f]/10 border-[#35D07F]/30' 
        : 'bg-red-500/10 border-red-500/30'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-bold ${network.correct ? 'text-[#35D07F]' : 'text-red-400'}`}>
            {network.correct ? '✅' : '❌'} Network: {network.name}
          </p>
          <p className="text-sm text-gray-400">Chain ID: {network.chainId}</p>
        </div>
        {!network.correct && (
          <button
            onClick={switchNetwork}
            className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded border border-[#3B82F6] hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
          >
            Switch to Celo Sepolia
          </button>
        )}
      </div>
      {!network.correct && (
        <p className="text-red-300 text-sm mt-2">
          ⚠️ You must be on Celo Sepolia to submit solutions!
        </p>
      )}
    </div>
  )
}
