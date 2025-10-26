const { ethers } = require('hardhat')

async function main() {
  console.log('🔐 Generating new Celo wallet for deployment...\n')

  // Generate random wallet
  const wallet = ethers.Wallet.createRandom()

  console.log('✅ New wallet generated!\n')
  console.log('📋 Wallet Details:')
  console.log('━'.repeat(80))
  console.log('Address:', wallet.address)
  console.log('Private Key:', wallet.privateKey)
  console.log('━'.repeat(80))

  console.log('\n⚠️  IMPORTANT - Save these securely!')
  console.log('1. Add private key to .env.local:')
  console.log(`   CELO_PRIVATE_KEY=${wallet.privateKey}`)
  console.log('\n2. Get test CELO from faucet:')
  console.log(`   https://faucet.celo.org/alfajores`)
  console.log(`   Enter address: ${wallet.address}`)
  console.log('\n3. Never share your private key!')
  console.log('\n🎯 This wallet is ready for deployment on Alfajores testnet.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
