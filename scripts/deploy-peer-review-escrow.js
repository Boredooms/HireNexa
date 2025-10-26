const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PeerReviewEscrow to Celo Sepolia...");

  // Celo Sepolia cUSD token address (with correct checksum)
  const cUSD_ADDRESS = "0x765de816845861e75a25fca122bb6baa3c1ffeac";
  
  // Your admin wallet address (the one that will approve/reject applications)
  // Replace with your actual wallet address
  const ADMIN_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || (await hre.ethers.getSigners())[0].address;

  console.log(`📝 Deploying with admin: ${ADMIN_ADDRESS}`);
  console.log(`💰 Using cUSD token: ${cUSD_ADDRESS}`);

  // Get the contract factory
  const PeerReviewEscrow = await hre.ethers.getContractFactory("PeerReviewEscrow");

  // Deploy the contract
  const peerReviewEscrow = await PeerReviewEscrow.deploy(cUSD_ADDRESS, ADMIN_ADDRESS);
  await peerReviewEscrow.waitForDeployment();

  const contractAddress = await peerReviewEscrow.getAddress();
  console.log(`✅ PeerReviewEscrow deployed to: ${contractAddress}`);

  // Save the address to a file
  const fs = require("fs");
  const deploymentInfo = {
    network: "celo-sepolia",
    chainId: 11142220,
    contract: "PeerReviewEscrow",
    address: contractAddress,
    admin: ADMIN_ADDRESS,
    cUSDToken: cUSD_ADDRESS,
    deployedAt: new Date().toISOString(),
    blockExplorer: `https://celo-sepolia.blockscout.com/address/${contractAddress}`,
  };

  fs.writeFileSync(
    "deployments/peer-review-escrow-sepolia.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📋 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🔗 View on Blockscout:");
  console.log(deploymentInfo.blockExplorer);

  console.log("\n📝 Add to .env.local:");
  console.log(`NEXT_PUBLIC_PEER_REVIEW_ESCROW_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_PEER_REVIEW_ESCROW_ADMIN=${ADMIN_ADDRESS}`);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
