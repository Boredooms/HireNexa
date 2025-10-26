const hre = require('hardhat')

async function main() {
  console.log('🚀 Deploying UpdatablePortfolioNFT to Celo...')

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners()
  console.log(`📝 Deploying with account: ${deployer.address}`)

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log(`💰 Account balance: ${hre.ethers.formatEther(balance)} CELO`)

  if (balance === 0n) {
    console.error('❌ Error: Account has no CELO balance!')
    console.log('Please fund your account from the faucet:')
    console.log('https://faucet.celo.org/sepolia')
    process.exit(1)
  }

  // Deploy the contract
  console.log('\n📦 Deploying contract...')
  const UpdatablePortfolioNFT = await hre.ethers.getContractFactory('UpdatablePortfolioNFT')
  const portfolioNFT = await UpdatablePortfolioNFT.deploy()

  await portfolioNFT.waitForDeployment()

  const contractAddress = await portfolioNFT.getAddress()

  console.log('\n✅ UpdatablePortfolioNFT deployed!')
  console.log(`📍 Contract Address: ${contractAddress}`)
  console.log(`🔍 Explorer: https://celo-sepolia.blockscout.com/address/${contractAddress}`)

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  }

  console.log('\n📋 Deployment Info:')
  console.log(JSON.stringify(deploymentInfo, null, 2))

  console.log('\n🎉 Deployment complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Add to .env.local:')
  console.log(`   NEXT_PUBLIC_PORTFOLIO_NFT_CONTRACT=${contractAddress}`)
  console.log('\n2. Update your frontend to use this contract address')
  console.log('\n3. Test minting a portfolio NFT!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  })
