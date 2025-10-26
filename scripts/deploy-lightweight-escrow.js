const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying LightweightSkillEscrow to Celo Sepolia...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO");
  console.log("💡 Estimated deployment cost: ~0.5 CELO\n");

  // Deploy contract
  console.log("⏳ Deploying LightweightSkillEscrow...");
  const LightweightSkillEscrow = await hre.ethers.getContractFactory("LightweightSkillEscrow");
  const escrow = await LightweightSkillEscrow.deploy();

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("✅ LightweightSkillEscrow deployed to:", address);
  
  console.log("\n🔗 Blockchain Explorer:");
  console.log(`https://celo-sepolia.blockscout.com/address/${address}`);

  console.log("\n📋 Add to .env.local:");
  console.log(`NEXT_PUBLIC_LIGHTWEIGHT_ESCROW_ADDRESS=${address}`);

  console.log("\n💰 Usage:");
  console.log("- Minimum deposit: 0.01 CELO");
  console.log("- Recommended: 0.1 CELO per person");
  console.log("- Total escrow: 0.2 CELO");
  console.log("- Gas per exchange: ~0.03 CELO");

  console.log("\n⏳ Waiting for block confirmations...");
  await escrow.deploymentTransaction().wait(5);

  console.log("\n✅ Verifying contract on Blockscout...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified!");
  } catch (error) {
    console.log("⚠️ Verification failed:", error.message);
    console.log("You can verify manually later");
  }

  // Show final balance
  const finalBalance = await hre.ethers.provider.getBalance(deployer.address);
  const spent = balance - finalBalance;
  console.log("\n💸 Deployment cost:", hre.ethers.formatEther(spent), "CELO");
  console.log("💰 Remaining balance:", hre.ethers.formatEther(finalBalance), "CELO");

  console.log("\n🎉 Deployment complete!");
  console.log("\n📚 Next steps:");
  console.log("1. Add contract address to .env.local");
  console.log("2. Test with 0.1 CELO deposits");
  console.log("3. Monitor gas costs");
  console.log("4. Scale up if needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
