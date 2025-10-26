const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Assignment Platform Contracts to Celo Sepolia Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", await deployer.getAddress());
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", balance.toString(), "\n");

  // Native S-CELO on Celo Sepolia testnet (use zero address for native token)
  const CELO_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000"; // Native S-CELO

  // 1. Deploy AssignmentCertificate NFT
  console.log("📜 Deploying AssignmentCertificate...");
  const AssignmentCertificate = await hre.ethers.getContractFactory("AssignmentCertificate");
  const certificate = await AssignmentCertificate.deploy();
  await certificate.waitForDeployment();
  const certificateAddress = await certificate.getAddress();
  console.log("✅ AssignmentCertificate deployed to:", certificateAddress);
  console.log();

  // 2. Deploy AssignmentEscrow
  console.log("💰 Deploying AssignmentEscrow...");
  const AssignmentEscrow = await hre.ethers.getContractFactory("AssignmentEscrow");
  const escrow = await AssignmentEscrow.deploy(CELO_TOKEN_ADDRESS);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ AssignmentEscrow deployed to:", escrowAddress);
  console.log();

  // 3. Connect contracts
  console.log("🔗 Connecting contracts...");
  
  // Set certificate contract in escrow
  const setCertTx = await escrow.setCertificateContract(certificateAddress);
  await setCertTx.wait();
  console.log("✅ Certificate contract set in Escrow");
  
  // Authorize escrow as minter in certificate
  const authTx = await certificate.authorizeMinter(escrowAddress);
  await authTx.wait();
  console.log("✅ Escrow authorized as certificate minter");
  console.log();

  // 4. Verify contracts on Blockscout
  console.log("🔍 Waiting for block confirmations...");
  // Wait a bit for indexing
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log("\n📝 Verifying contracts on Blockscout...");
  
  try {
    await hre.run("verify:verify", {
      address: certificateAddress,
      constructorArguments: [],
    });
    console.log("✅ AssignmentCertificate verified");
  } catch (error) {
    console.log("⚠️  Certificate verification failed:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: escrowAddress,
      constructorArguments: [CELO_TOKEN_ADDRESS],
    });
    console.log("✅ AssignmentEscrow verified");
  } catch (error) {
    console.log("⚠️  Escrow verification failed:", error.message);
  }

  // 5. Save deployment info
  const deploymentInfo = {
    network: "celo-sepolia",
    chainId: 11142220,
    deployer: await deployer.getAddress(),
    contracts: {
      AssignmentCertificate: {
        address: certificateAddress,
        txHash: certificate.deploymentTransaction().hash,
      },
      AssignmentEscrow: {
        address: escrowAddress,
        txHash: escrow.deploymentTransaction().hash,
      },
    },
    celoToken: CELO_TOKEN_ADDRESS,
    deployedAt: new Date().toISOString(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log("====================");
  console.log("Network:", deploymentInfo.network);
  console.log("Chain ID:", deploymentInfo.chainId);
  console.log("\nContracts:");
  console.log("- AssignmentCertificate:", certificateAddress);
  console.log("- AssignmentEscrow:", escrowAddress);
  console.log("\nS-CELO Token:", CELO_TOKEN_ADDRESS);
  console.log("\nBlockscout Explorer:");
  console.log(`- Certificate: https://celo-sepolia.blockscout.com/address/${certificateAddress}`);
  console.log(`- Escrow: https://celo-sepolia.blockscout.com/address/${escrowAddress}`);

  // Save to file
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, "assignment-contracts-sepolia.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n✅ Deployment info saved to deployments/assignment-contracts-sepolia.json");
  
  // Update .env.local
  console.log("\n📝 Add these to your .env.local:");
  console.log("=====================================");
  console.log(`NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS=${escrowAddress}`);
  console.log(`NEXT_PUBLIC_ASSIGNMENT_CERTIFICATE_ADDRESS=${certificateAddress}`);
  console.log(`NEXT_PUBLIC_CELO_TOKEN_ADDRESS=${CELO_TOKEN_ADDRESS}`);
  
  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
