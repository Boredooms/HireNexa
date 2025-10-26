import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import WalletConnect from '@/components/celo/WalletConnect'
import NetworkSwitcher from '@/components/celo/NetworkSwitcher'
import { ArrowLeft, Gem, Wallet } from 'lucide-react'

export default async function CeloDashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
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
            <div className="flex items-center gap-3">
              <img 
                src="/attachments/celo-celo-logo.png" 
                alt="Celo" 
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-bold text-white">Celo Blockchain</h1>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Celo Blockchain Integration
          </h2>
          <p className="text-base text-gray-400">
            Connect your wallet and interact with Celo smart contracts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Wallet Connection */}
          <WalletConnect />

          {/* Network Switcher */}
          <NetworkSwitcher />
        </div>

        {/* Portfolio NFT Feature */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#3B82F6]/20 rounded-lg flex-shrink-0">
              <Gem className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                Portfolio NFT
              </h3>
              <p className="text-gray-400 mb-3 text-sm">
                Your complete professional portfolio as a blockchain-verified NFT
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-[#3B82F6]">✓</span>
                  <span>GitHub-synced skills & projects</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-[#3B82F6]">✓</span>
                  <span>AI-analyzed expertise</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-[#3B82F6]">✓</span>
                  <span>IPFS-hosted metadata</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-[#3B82F6]">✓</span>
                  <span>Tamper-proof & verifiable</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/dashboard/github"
                  className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm"
                >
                  Sync GitHub & Mint NFT
                </Link>
                <Link
                  href="/dashboard/nft"
                  className="px-4 py-2 bg-white/10 border border-white/20 text-gray-300 rounded-lg font-semibold hover:bg-white/20 transition text-sm"
                >
                  View My NFT
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Contract Info */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-5 mb-6">
          <h3 className="text-base font-bold text-white mb-3">
            Portfolio NFT Smart Contract
          </h3>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h4 className="font-semibold text-white mb-1 text-sm">PortfolioNFT</h4>
            <p className="text-xs text-gray-400 mb-2">
              ERC-721 NFT contract for minting and managing portfolio NFTs on Celo Sepolia
            </p>
            <div className="font-mono text-xs text-gray-300 break-all bg-white/5 p-2 rounded mb-2 border border-white/10">
              {process.env.NEXT_PUBLIC_PORTFOLIO_NFT_CONTRACT || 'Not configured'}
            </div>
            {process.env.NEXT_PUBLIC_PORTFOLIO_NFT_CONTRACT && (
              <a
                href={`https://celo-sepolia.blockscout.com/address/${process.env.NEXT_PUBLIC_PORTFOLIO_NFT_CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#3B82F6] hover:text-[#60A5FA] font-semibold transition"
              >
                View on Block Explorer →
              </a>
            )}
          </div>
        </div>

        {/* Resources */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-5">
          <h3 className="text-lg font-bold text-white mb-3">Celo Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a
              href="https://faucet.celo.org/alfajores"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white/5 rounded-lg border border-white/20 hover:bg-white/10 transition"
            >
              <h4 className="font-semibold mb-1 text-white text-sm">💧 Faucet</h4>
              <p className="text-xs text-gray-400">Get free testnet CELO</p>
            </a>

            <a
              href="https://explorer.celo.org/alfajores"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white/5 rounded-lg border border-white/20 hover:bg-white/10 transition"
            >
              <h4 className="font-semibold mb-1 text-white text-sm">🔍 Explorer</h4>
              <p className="text-xs text-gray-400">View transactions</p>
            </a>

            <a
              href="https://docs.celo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white/5 rounded-lg border border-white/20 hover:bg-white/10 transition"
            >
              <h4 className="font-semibold mb-1 text-white text-sm">📚 Docs</h4>
              <p className="text-xs text-gray-400">Learn about Celo</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
