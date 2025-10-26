/**
 * Deploy New Smart Contracts to Celo Sepolia
 * - SkillVerification.sol
 * - JobMarketplace.sol
 * - UpdatablePortfolioNFT.sol (if not deployed)
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying new contracts to Celo Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO\n");

  if (balance < hre.ethers.parseEther("0.1")) {
    console.warn("⚠️  Low balance! Get testnet CELO from https://faucet.celo.org/sepolia\n");
  }

  // Celo Sepolia cUSD token address
  const cUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
  
  const deployments = {
    network: "celo-sepolia",
    chainId: 11142220,
    deployer: deployer.address,
    contracts: {},
    deployedAt: new Date().toISOString()
  };

  try {
    // =====================================================
    // 1. Deploy SkillVerification
    // =====================================================
    console.log("📋 Deploying SkillVerification...");
    const SkillVerification = await hre.ethers.getContractFactory("SkillVerification");
    const skillVerification = await SkillVerification.deploy(cUSD_ADDRESS);
    await skillVerification.waitForDeployment();
    const skillVerificationAddress = await skillVerification.getAddress();
    
    console.log("✅ SkillVerification deployed to:", skillVerificationAddress);
    deployments.contracts.SkillVerification = skillVerificationAddress;
    
    // Wait for block confirmation
    console.log("⏳ Waiting for block confirmations...");
    await skillVerification.deploymentTransaction().wait(3);
    console.log("✅ SkillVerification confirmed!\n");

    // =====================================================
    // 2. Deploy JobMarketplace
    // =====================================================
    console.log("📋 Deploying JobMarketplace...");
    const JobMarketplace = await hre.ethers.getContractFactory("JobMarketplace");
    const jobMarketplace = await JobMarketplace.deploy(cUSD_ADDRESS);
    await jobMarketplace.waitForDeployment();
    const jobMarketplaceAddress = await jobMarketplace.getAddress();
    
    console.log("✅ JobMarketplace deployed to:", jobMarketplaceAddress);
    deployments.contracts.JobMarketplace = jobMarketplaceAddress;
    
    // Wait for block confirmation
    console.log("⏳ Waiting for block confirmations...");
    await jobMarketplace.deploymentTransaction().wait(3);
    console.log("✅ JobMarketplace confirmed!\n");

    // =====================================================
    // 3. Deploy UpdatablePortfolioNFT (if not exists)
    // =====================================================
    console.log("📋 Deploying UpdatablePortfolioNFT...");
    const UpdatablePortfolioNFT = await hre.ethers.getContractFactory("UpdatablePortfolioNFT");
    const portfolioNFT = await UpdatablePortfolioNFT.deploy();
    await portfolioNFT.waitForDeployment();
    const portfolioNFTAddress = await portfolioNFT.getAddress();
    
    console.log("✅ UpdatablePortfolioNFT deployed to:", portfolioNFTAddress);
    deployments.contracts.UpdatablePortfolioNFT = portfolioNFTAddress;
    
    // Wait for block confirmation
    console.log("⏳ Waiting for block confirmations...");
    await portfolioNFT.deploymentTransaction().wait(3);
    console.log("✅ UpdatablePortfolioNFT confirmed!\n");

    // =====================================================
    // 4. Save Deployment Info
    // =====================================================
    const deploymentsPath = path.join(__dirname, '..', 'deployments-sepolia-v2.json');
    fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
    console.log("💾 Deployment info saved to:", deploymentsPath);

    // =====================================================
    // 5. Update .env.local template
    // =====================================================
    console.log("\n📝 Add these to your .env.local:\n");
    console.log(`# New Smart Contracts (Celo Sepolia)`);
    console.log(`NEXT_PUBLIC_SKILL_VERIFICATION_SEPOLIA=${skillVerificationAddress}`);
    console.log(`NEXT_PUBLIC_JOB_MARKETPLACE_SEPOLIA=${jobMarketplaceAddress}`);
    console.log(`NEXT_PUBLIC_PORTFOLIO_NFT_SEPOLIA=${portfolioNFTAddress}`);
    console.log(`NEXT_PUBLIC_CUSD_TOKEN_SEPOLIA=${cUSD_ADDRESS}`);

    // =====================================================
    // 6. Verification Instructions
    // =====================================================
    console.log("\n🔍 Verify contracts on Blockscout:");
    console.log(`https://celo-sepolia.blockscout.com/address/${skillVerificationAddress}`);
    console.log(`https://celo-sepolia.blockscout.com/address/${jobMarketplaceAddress}`);
    console.log(`https://celo-sepolia.blockscout.com/address/${portfolioNFTAddress}`);

    console.log("\n✅ All contracts deployed successfully!");
    console.log("\n📊 Deployment Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Network:              Celo Sepolia`);
    console.log(`Chain ID:             11142220`);
    console.log(`Deployer:             ${deployer.address}`);
    console.log(`SkillVerification:    ${skillVerificationAddress}`);
    console.log(`JobMarketplace:       ${jobMarketplaceAddress}`);
    console.log(`UpdatablePortfolioNFT: ${portfolioNFTAddress}`);
    console.log(`cUSD Token:           ${cUSD_ADDRESS}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
