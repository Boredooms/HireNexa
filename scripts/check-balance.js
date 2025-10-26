const hre = require('hardhat')

async function main() {
  console.log('💰 Checking account balance...\n')

  const [account] = await hre.ethers.getSigners()
  const balance = await hre.ethers.provider.getBalance(account.address)

  console.log(`Network: ${hre.network.name}`)
  console.log(`Address: ${account.address}`)
  console.log(`Balance: ${hre.ethers.formatEther(balance)} CELO`)

  if (balance === 0n) {
    console.log('\n❌ No balance! Get testnet CELO from:')
    console.log('https://faucet.celo.org/sepolia')
  } else {
    console.log('\n✅ Account funded!')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
