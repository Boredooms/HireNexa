const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

async function main() {
  console.log('🚀 Deploying HireNexa contracts to Celo Sepolia Testnet...\n')

  const [deployer] = await ethers.getSigners()
  console.log('Deploying with account:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', ethers.formatEther(balance), 'CELO\n')

  if (parseFloat(ethers.formatEther(balance)) < 0.01) {
    console.log('⚠️  Low balance! Get test CELO from:')
    console.log('   https://faucet.celo.org/sepolia')
    console.log('   OR')
    console.log('   Discord: https://discord.gg/celo → #testnet-faucet')
    console.log('   Command: $request', deployer.address, 'sepolia\n')
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
    network: 'celo-sepolia',
    chainId: 11142220,
    deployer: deployer.address,
    contracts: {
      SkillsRegistry: skillsRegistryAddress,
      CredentialIssuer: credentialIssuerAddress,
    },
    deployedAt: new Date().toISOString(),
  }

  const deploymentsPath = path.join(__dirname, '../deployments-sepolia.json')
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2))

  console.log('\n📄 Deployment info saved to deployments-sepolia.json')
  console.log('\n🎉 Deployment complete!')
  console.log('\n📋 Add these to your .env.local:')
  console.log(`NEXT_PUBLIC_SKILLS_REGISTRY_SEPOLIA=${skillsRegistryAddress}`)
  console.log(`NEXT_PUBLIC_CREDENTIAL_ISSUER_SEPOLIA=${credentialIssuerAddress}`)
  console.log(`NEXT_PUBLIC_CELO_NETWORK=sepolia`)
  console.log('\n🔍 View on Explorer:')
  console.log(`https://celo-sepolia.blockscout.com/address/${skillsRegistryAddress}`)
  console.log(`https://celo-sepolia.blockscout.com/address/${credentialIssuerAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
