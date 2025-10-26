'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

/**
 * Automatically sync wallet address from Clerk to database
 * When user logs in with MetaMask via Clerk, extract and save the wallet address
 */
export default function WalletAddressSync() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    const syncWalletFromClerk = async () => {
      if (!isLoaded || !user) return

      // Check if user has Web3 wallet in Clerk
      const web3Wallets = user.web3Wallets || []
      
      if (web3Wallets.length === 0) {
        console.log('No Web3 wallets found in Clerk session')
        return
      }

      // Get the first (primary) wallet address
      const primaryWallet = web3Wallets[0]
      const walletAddress = primaryWallet.web3Wallet

      if (!walletAddress) {
        console.log('No wallet address found in Clerk Web3 wallet')
        return
      }

      console.log(`🔍 Found wallet in Clerk session: ${walletAddress}`)

      // Check if wallet is already saved in database
      try {
        const checkResponse = await fetch('/api/user/profile')
        if (checkResponse.ok) {
          const profile = await checkResponse.json()
          
          if (profile.wallet_address === walletAddress.toLowerCase()) {
            console.log('✅ Wallet address already synced')
            return
          }
        }

        // Save wallet address to database
        console.log(`💾 Syncing wallet address from Clerk to database: ${walletAddress}`)
        
        const response = await fetch('/api/user/save-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress }),
        })

        if (response.ok) {
          console.log('✅ Wallet address synced from Clerk to database')
        } else {
          console.error('❌ Failed to sync wallet address from Clerk')
        }
      } catch (error) {
        console.error('Error syncing wallet from Clerk:', error)
      }
    }

    syncWalletFromClerk()
  }, [user, isLoaded])

  // This component doesn't render anything
  return null
}
