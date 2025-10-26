'use client'

import { useState } from 'react'

const CELO_NETWORKS = {
  sepolia: {
    chainId: '0xaa044c', // 11142220 in hex (CORRECT!)
    chainName: 'Celo Sepolia Testnet',
    nativeCurrency: {
      name: 'CELO',
      symbol: 'S-CELO',
      decimals: 18,
    },
    rpcUrls: ['https://forno.celo-sepolia.celo-testnet.org'],
    blockExplorerUrls: ['https://celo-sepolia.blockscout.com'],
  },
  mainnet: {
    chainId: '0xa4ec', // 42220 in hex
    chainName: 'Celo Mainnet',
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
    rpcUrls: ['https://forno.celo.org'],
    blockExplorerUrls: ['https://explorer.celo.org'],
  },
  alfajores: {
    chainId: '0xaef3', // 44787 in hex
    chainName: 'Celo Alfajores Testnet',
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
    rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
    blockExplorerUrls: ['https://explorer.celo.org/alfajores'],
  },
}

export default function NetworkSwitcher() {
  const [switching, setSwitching] = useState(false)

  const switchNetwork = async (network: 'sepolia' | 'mainnet' | 'alfajores') => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!')
      return
    }

    setSwitching(true)
    try {
      const networkConfig = CELO_NETWORKS[network]

      // Try to switch to the network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkConfig.chainId }],
        })
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          })
        } else {
          throw switchError
        }
      }

      alert(`Switched to ${networkConfig.chainName}!`)
    } catch (error) {
      console.error('Error switching network:', error)
      alert('Failed to switch network')
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg shadow p-4 border border-white/20">
      <h4 className="font-semibold text-white mb-3">Switch Celo Network</h4>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => switchNetwork('sepolia')}
          disabled={switching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-lg"
        >
          Sepolia Testnet ⭐
        </button>
        <button
          onClick={() => switchNetwork('mainnet')}
          disabled={switching}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition shadow-lg"
        >
          Celo Mainnet
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        💡 Use Sepolia for testing (better faucets!)
      </p>
    </div>
  )
}
