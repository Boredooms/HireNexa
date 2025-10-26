const hre = require('hardhat')

async function main() {
  const contractAddress = '0xb83B9a7B2eFAF4F77EF47EeeAAb4595c49450297'
  const tokenId = 1
  
  console.log(`🔍 Checking tokenURI for Token #${tokenId}...`)
  console.log(`📍 Contract: ${contractAddress}`)
  
  const contract = await hre.ethers.getContractAt('UpdatablePortfolioNFT', contractAddress)
  
  try {
    // Check what's stored
    const portfolio = await contract.portfolios(tokenId)
    console.log(`\n📦 Stored IPFS Hash:`)
    console.log(portfolio.encryptedIpfsHash)
    
    // Check what tokenURI returns
    const tokenURI = await contract.tokenURI(tokenId)
    console.log(`\n✅ Token URI returned:`)
    console.log(tokenURI)
    
    // Check if it's a gateway URL
    if (tokenURI.startsWith('https://gateway.pinata.cloud/ipfs/')) {
      console.log(`\n✅ Using Pinata gateway - CORRECT!`)
      
      // Try to fetch it
      console.log(`\n🌐 Testing URL...`)
      const response = await fetch(tokenURI)
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Metadata fetched successfully!`)
        console.log(`Name: ${data.name}`)
        console.log(`Description: ${data.description}`)
      } else {
        console.log(`❌ Failed to fetch: ${response.status} ${response.statusText}`)
      }
    } else if (tokenURI.startsWith('ipfs://')) {
      console.log(`\n⚠️ Using ipfs:// protocol - Blockscout might not fetch it`)
    } else {
      console.log(`\n❓ Unexpected format`)
    }
  } catch (error) {
    console.error(`\n❌ Error:`, error.message)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
