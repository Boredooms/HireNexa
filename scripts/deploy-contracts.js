const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

async function main() {
  console.log('🚀 Deploying HireNexa contracts to Celo Alfajores...\n')

  const [deployer] = await ethers.getSigners()
  console.log('Deploying with account:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', ethers.formatEther(balance), 'CELO\n')

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
    network: 'alfajores',
    chainId: 44787,
    deployer: deployer.address,
    contracts: {
      SkillsRegistry: skillsRegistryAddress,
      CredentialIssuer: credentialIssuerAddress,
    },
    deployedAt: new Date().toISOString(),
  }

  const deploymentsPath = path.join(__dirname, '../deployments.json')
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2))

  console.log('\n📄 Deployment info saved to deployments.json')
  console.log('\n🎉 Deployment complete!')
  console.log('\n📋 Add these to your .env file:')
  console.log(`NEXT_PUBLIC_SKILLS_REGISTRY_TESTNET=${skillsRegistryAddress}`)
  console.log(`NEXT_PUBLIC_CREDENTIAL_ISSUER_TESTNET=${credentialIssuerAddress}`)
  console.log('\n🔍 View on Explorer:')
  console.log(`https://explorer.celo.org/alfajores/address/${skillsRegistryAddress}`)
  console.log(`https://explorer.celo.org/alfajores/address/${credentialIssuerAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
