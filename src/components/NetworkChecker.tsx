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
      <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 mb-4">
        <p className="text-red-700 font-bold">❌ Network Error</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (!network) {
    return (
      <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 mb-4">
        <p className="text-gray-700">Checking network...</p>
      </div>
    )
  }

  return (
    <div className={`border-2 rounded-lg p-4 mb-4 ${
      network.correct 
        ? 'bg-green-100 border-green-500' 
        : 'bg-red-100 border-red-500'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-bold ${network.correct ? 'text-green-700' : 'text-red-700'}`}>
            {network.correct ? '✅' : '❌'} Network: {network.name}
          </p>
          <p className="text-sm text-gray-600">Chain ID: {network.chainId}</p>
        </div>
        {!network.correct && (
          <button
            onClick={switchNetwork}
            className="px-4 py-2 bg-blue-500 text-white font-bold rounded border-2 border-black hover:bg-blue-600"
          >
            Switch to Celo Sepolia
          </button>
        )}
      </div>
      {!network.correct && (
        <p className="text-red-600 text-sm mt-2">
          ⚠️ You must be on Celo Sepolia to submit solutions!
        </p>
      )}
    </div>
  )
}
