const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PeerReviewEscrow to Celo Sepolia...");

  // Celo Sepolia cUSD token address
  const CUSD_TOKEN_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO");

  // Deploy PeerReviewEscrow
  console.log("\n📦 Deploying PeerReviewEscrow contract...");
  const PeerReviewEscrow = await hre.ethers.getContractFactory("PeerReviewEscrow");
  const escrow = await PeerReviewEscrow.deploy(
    CUSD_TOKEN_ADDRESS,
    deployer.address // Admin address
  );

  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log("\n✅ PeerReviewEscrow deployed to:", escrowAddress);
  console.log("📄 cUSD Token:", CUSD_TOKEN_ADDRESS);
  console.log("👤 Admin:", deployer.address);

  console.log("\n📋 Add this to your .env.local:");
  console.log(`NEXT_PUBLIC_PEER_REVIEW_ESCROW_ADDRESS=${escrowAddress}`);

  console.log("\n🔍 Verify on Celoscan:");
  console.log(`https://alfajores.celoscan.io/address/${escrowAddress}`);

  // Wait for a few block confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await escrow.deploymentTransaction()?.wait(3);
  console.log("✅ Confirmed!");

  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
