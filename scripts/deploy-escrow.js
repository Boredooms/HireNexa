const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SkillBarterEscrow to Celo Sepolia...\n");

  // cUSD address on Celo Sepolia Testnet
  const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO\n");

  // Deploy contract
  console.log("⏳ Deploying SkillBarterEscrow...");
  const SkillBarterEscrow = await hre.ethers.getContractFactory("SkillBarterEscrow");
  const escrow = await SkillBarterEscrow.deploy(CUSD_ADDRESS);

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("✅ SkillBarterEscrow deployed to:", address);
  console.log("📄 cUSD Token Address:", CUSD_ADDRESS);
  
  console.log("\n🔗 Blockchain Explorer:");
  console.log(`https://celo-sepolia.blockscout.com/address/${address}`);

  console.log("\n📋 Add to .env.local:");
  console.log(`NEXT_PUBLIC_SKILL_BARTER_ESCROW_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_CUSD_ADDRESS=${CUSD_ADDRESS}`);

  console.log("\n⏳ Waiting for block confirmations...");
  await escrow.deploymentTransaction().wait(5);

  console.log("\n✅ Verifying contract on Blockscout...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [CUSD_ADDRESS],
    });
    console.log("✅ Contract verified!");
  } catch (error) {
    console.log("⚠️ Verification failed:", error.message);
    console.log("You can verify manually later");
  }

  console.log("\n🎉 Deployment complete!");
  console.log("\n📚 Next steps:");
  console.log("1. Add contract address to .env.local");
  console.log("2. Get cUSD testnet tokens from faucet");
  console.log("3. Test proposing a barter");
  console.log("4. Test accepting and daily check-ins");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
