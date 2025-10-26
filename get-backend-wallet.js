// Quick script to get backend wallet address from private key
const Web3 = require('web3');

const privateKey = '0x1fd13c68e8410f7faa253dc2901b9e8bde37f3c2abedf20f536d9d3d5ab739d2';

const web3 = new Web3();
const account = web3.eth.accounts.privateKeyToAccount(privateKey);

console.log('\n🔑 Backend Wallet Information:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📍 Address:', account.address);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n💰 Fund this wallet with CELO SEPOLIA tokens:');
console.log('   Option 1: https://faucet.celo.org/sepolia');
console.log('   Option 2: https://faucet.polygon.technology/ (select Celo Sepolia)');
console.log('\n🔍 Check balance:');
console.log(`   https://celo-sepolia.blockscout.com/address/${account.address}`);
console.log('\n⚠️  IMPORTANT: Use CELO SEPOLIA faucet, NOT Alfajores!');
console.log('✅ After funding, sync GitHub again to mint NFT!\n');
