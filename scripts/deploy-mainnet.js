const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

async function main() {
  console.log('🚀 Deploying HireNexa contracts to CELO MAINNET...\n')
  console.log('⚠️  WARNING: This will use REAL CELO and cost real money!\n')
  
  // Confirmation prompt
  console.log('💰 Estimated cost: ~$0.30 USD in CELO')
  console.log('⏸️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
  
  await new Promise(resolve => setTimeout(resolve, 5000))

  const [deployer] = await ethers.getSigners()
  console.log('Deploying with account:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', ethers.formatEther(balance), 'CELO\n')

  if (parseFloat(ethers.formatEther(balance)) < 0.1) {
    throw new Error('Insufficient CELO balance. Need at least 0.1 CELO for deployment.')
  }

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
    network: 'celo-mainnet',
    chainId: 42220,
    deployer: deployer.address,
    contracts: {
      SkillsRegistry: skillsRegistryAddress,
      CredentialIssuer: credentialIssuerAddress,
    },
    deployedAt: new Date().toISOString(),
  }

  const deploymentsPath = path.join(__dirname, '../deployments-mainnet.json')
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2))

  console.log('\n📄 Deployment info saved to deployments-mainnet.json')
  console.log('\n🎉 Deployment complete!')
  console.log('\n📋 Add these to your .env.local:')
  console.log(`NEXT_PUBLIC_SKILLS_REGISTRY_MAINNET=${skillsRegistryAddress}`)
  console.log(`NEXT_PUBLIC_CREDENTIAL_ISSUER_MAINNET=${credentialIssuerAddress}`)
  console.log(`NEXT_PUBLIC_USE_MAINNET=true`)
  console.log('\n🔍 View on Explorer:')
  console.log(`https://explorer.celo.org/mainnet/address/${skillsRegistryAddress}`)
  console.log(`https://explorer.celo.org/mainnet/address/${credentialIssuerAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
