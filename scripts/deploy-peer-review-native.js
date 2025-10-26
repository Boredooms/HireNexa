const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PeerReviewEscrowNative to Celo Sepolia...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO");

  if (balance < hre.ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low balance. Get more CELO from https://faucet.celo.org");
  }

  // Admin address (use deployer as admin for now, change later if needed)
  const adminAddress = deployer.address;
  console.log("👤 Admin address:", adminAddress);

  // Deploy contract
  console.log("\n📦 Deploying contract...");
  const PeerReviewEscrowNative = await hre.ethers.getContractFactory("PeerReviewEscrowNative");
  const contract = await PeerReviewEscrowNative.deploy(adminAddress);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ PeerReviewEscrowNative deployed to:", contractAddress);
  console.log("🔗 View on Blockscout: https://celo-sepolia.blockscout.com/address/" + contractAddress);
  console.log("🔗 View on Celoscan: https://celoscan.io/address/" + contractAddress);

  // Wait for a few block confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await contract.deploymentTransaction().wait(5);

  // Verify contract on explorer (optional)
  console.log("\n🔍 Verifying contract on Blockscout...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [adminAddress],
    });
    console.log("✅ Contract verified!");
  } catch (error) {
    console.log("⚠️  Verification failed:", error.message);
    console.log("You can verify manually later with:");
    console.log(`npx hardhat verify --network celoSepolia ${contractAddress} ${adminAddress}`);
  }

  // Print deployment summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Contract Address:", contractAddress);
  console.log("Admin Address:", adminAddress);
  console.log("Network: Celo Sepolia (Chain ID: 11142220)");
  console.log("RPC URL: https://forno.celo-sepolia.celo-testnet.org");
  console.log("Verification Fee: 0.01 CELO");
  console.log("Platform Fee: 10%");
  console.log("Currency: S-CELO (Sepolia CELO)");
  console.log("=".repeat(60));

  console.log("\n📝 Next steps:");
  console.log("1. Update your .env file:");
  console.log(`   NEXT_PUBLIC_PEER_REVIEW_ESCROW_ADDRESS=${contractAddress}`);
  console.log("\n2. Approve reviewers:");
  console.log(`   await contract.approveReviewer("0xReviewerAddress")`);
  console.log("\n3. Get free CELO from: https://faucet.celo.org");
  console.log("\n4. Test the payment flow in your app!");

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
