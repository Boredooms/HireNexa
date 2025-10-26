const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

async function main() {
  console.log('🚀 Deploying HireNexa contracts to LOCAL Hardhat Network...\n')
  console.log('💡 This uses FREE local blockchain - no faucet needed!\n')

  const [deployer] = await ethers.getSigners()
  console.log('Deploying with account:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', ethers.formatEther(balance), 'ETH\n')

  // Deploy SkillsRegistry
  console.log('📝 Deploying SkillsRegistry...')
  const SkillsRegistry = await ethers.getContractFactory('SkillsRegistry')
  const skillsRegistry = await SkillsRegistry.deploy()
  await skillsRegistry.waitForDeployment()
  const skillsRegistryAddress = await skillsRegistry.getAddress()
  console.log('✅ SkillsRegistry deployed to:', skillsRegistryAddress)

  // Deploy CredentialIssuer
  console.log('\n📝 Deploying CredentialIssuer...')
  const CredentialIssuer = await ethers.getContractFactory('CredentialIssuer')
  const credentialIssuer = await CredentialIssuer.deploy()
  await credentialIssuer.waitForDeployment()
  const credentialIssuerAddress = await credentialIssuer.getAddress()
  console.log('✅ CredentialIssuer deployed to:', credentialIssuerAddress)

  // Save deployment info
  const deploymentInfo = {
    network: 'localhost',
    chainId: 31337,
    deployer: deployer.address,
    contracts: {
      SkillsRegistry: skillsRegistryAddress,
      CredentialIssuer: credentialIssuerAddress,
    },
    deployedAt: new Date().toISOString(),
  }

  const deploymentsPath = path.join(__dirname, '../deployments-local.json')
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2))

  console.log('\n📄 Deployment info saved to deployments-local.json')
  console.log('\n🎉 Deployment complete!')
  console.log('\n📋 Add these to your .env.local:')
  console.log(`NEXT_PUBLIC_SKILLS_REGISTRY_LOCAL=${skillsRegistryAddress}`)
  console.log(`NEXT_PUBLIC_CREDENTIAL_ISSUER_LOCAL=${credentialIssuerAddress}`)
  console.log('\n💡 To use these contracts:')
  console.log('1. Keep Hardhat node running: npx hardhat node')
  console.log('2. Connect MetaMask to localhost:8545')
  console.log('3. Import test account from Hardhat node output')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
