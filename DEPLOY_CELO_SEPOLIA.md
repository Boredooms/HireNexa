# 🚀 Deploy to Celo Sepolia Testnet - Complete Guide

## ✅ What We Changed

### 1. Smart Contract
- **Old**: `PeerReviewEscrow.sol` (uses cUSD ERC-20 token)
- **New**: `PeerReviewEscrowNative.sol` (uses native CELO)

### 2. Frontend Configuration
- **Network**: Celo Sepolia (Chain ID: 1287)
- **Payment**: 0.01 CELO (native token)
- **No token approvals needed!**

### 3. Key Differences

| Feature | Old (cUSD) | New (Native CELO) |
|---------|------------|-------------------|
| Token | ERC-20 cUSD | Native CELO |
| Approval | Required | Not needed |
| Payment | 5.5 cUSD | 0.01 CELO |
| Complexity | High | Low |
| Gas Cost | Higher | Lower |

---

## 📋 Prerequisites

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Get a Private Key
```bash
# Create a new wallet or export from MetaMask
# NEVER share your private key!
```

### 3. Get Free Celo Sepolia CELO
Visit: **https://faucet.celo.org**
- Select "Celo Sepolia" network
- Paste your wallet address
- Get free CELO tokens

---

## 🔧 Step 1: Configure Environment

### Update `.env.local`:
```env
# Celo Blockchain
CELO_PRIVATE_KEY=your_private_key_here_without_0x
NEXT_PUBLIC_CELO_NETWORK=celo-sepolia
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo-testnet.org

# After deployment, add this:
NEXT_PUBLIC_PEER_REVIEW_ESCROW_ADDRESS=0xYourContractAddress
```

---

## 🚀 Step 2: Deploy Smart Contract

### Compile Contract:
```bash
npx hardhat compile
```

### Deploy to Celo Sepolia:
```bash
npx hardhat run scripts/deploy-peer-review-native.js --network celoSepolia
```

### Expected Output:
```
🚀 Deploying PeerReviewEscrowNative to Celo Sepolia...
📝 Deploying with account: 0xYourAddress
💰 Account balance: 1.5 CELO

📦 Deploying contract...
✅ PeerReviewEscrowNative deployed to: 0xContractAddress
🔗 View on explorer: https://celo-sepolia.blockscout.com/address/0xContractAddress

📋 DEPLOYMENT SUMMARY
============================================================
Contract Address: 0xContractAddress
Admin Address: 0xYourAddress
Network: Celo Sepolia (Chain ID: 1287)
Verification Fee: 0.01 CELO
Platform Fee: 10%
============================================================
```

---

## 📝 Step 3: Update Frontend

### 1. Update `.env.local`:
```env
NEXT_PUBLIC_PEER_REVIEW_ESCROW_ADDRESS=0xYourContractAddressFromDeployment
```

### 2. Restart Dev Server:
```bash
npm run dev
```

---

## 👥 Step 4: Approve Reviewers

### Option A: Using Hardhat Console
```bash
npx hardhat console --network celoSepolia
```

```javascript
const contract = await ethers.getContractAt(
  "PeerReviewEscrowNative",
  "0xYourContractAddress"
);

// Approve a single reviewer
await contract.approveReviewer("0xReviewerAddress");

// Approve multiple reviewers
await contract.batchApproveReviewers([
  "0xReviewer1",
  "0xReviewer2",
  "0xReviewer3"
]);
```

### Option B: Using Etherscan/Blockscout
1. Go to: `https://celo-sepolia.blockscout.com/address/0xYourContractAddress`
2. Click "Write Contract"
3. Connect your wallet
4. Call `approveReviewer` with reviewer address

---

## 🧪 Step 5: Test the Flow

### 1. Submit a Skill
- Go to: `http://localhost:3000/dashboard/skills/submit`
- Fill out the form
- Click "Submit for Verification"

### 2. Complete Payment
- You'll be redirected to payment page
- Click "Connect MetaMask"
- MetaMask will auto-switch to Celo Sepolia
- Click "Pay 0.01 CELO"
- Confirm transaction in MetaMask

### 3. Verify Transaction
- Check on: `https://celo-sepolia.blockscout.com`
- Search for your transaction hash
- Verify payment was successful

---

## 🔍 Verify Contract (Optional)

### Manual Verification:
```bash
npx hardhat verify --network celoSepolia 0xYourContractAddress 0xYourAdminAddress
```

---

## 📊 Contract Functions

### User Functions:
- `payForVerification(submissionId)` - Pay 0.01 CELO for verification

### Admin Functions:
- `approveReviewer(address)` - Approve a reviewer
- `removeReviewer(address)` - Remove a reviewer
- `batchApproveReviewers(address[])` - Approve multiple reviewers
- `completeVerification(verificationId, reviewer, score)` - Complete and pay reviewer
- `withdrawPlatformFees()` - Withdraw collected fees

### View Functions:
- `getVerification(verificationId)` - Get verification details
- `getReviewerStats(address)` - Get reviewer earnings
- `getContractBalance()` - Check contract balance

---

## 🎯 Network Details

```
Network Name: Celo Sepolia Testnet
RPC URL: https://forno.celo-sepolia.celo-testnet.org
Chain ID: 11142220 (0xaa0dc)
Currency Symbol: S-CELO (Sepolia CELO)
Block Explorer: https://celo-sepolia.blockscout.com
Alternative Explorer: https://celoscan.io
Faucet: https://faucet.celo.org
```

---

## 💰 Payment Flow

```
User submits skill
    ↓
User pays 0.01 CELO
    ↓
Contract holds funds
    ↓
Admin assigns to reviewer
    ↓
Reviewer completes verification
    ↓
Contract pays reviewer 0.009 CELO (90%)
    ↓
Platform keeps 0.001 CELO (10%)
```

---

## ⚠️ Troubleshooting

### "Insufficient CELO balance"
- Get more CELO from: https://faucet.celo.org
- Wait 1-2 minutes for tokens to arrive

### "Wrong network"
- MetaMask should auto-switch
- If not, manually add Celo Sepolia network

### "Transaction failed"
- Check you have enough CELO for gas
- Try increasing gas limit

### "Contract not deployed"
- Check deployment was successful
- Verify contract address in `.env.local`
- Restart dev server

---

## 🎉 Success Checklist

- ✅ Contract deployed to Celo Sepolia
- ✅ Contract address added to `.env.local`
- ✅ Reviewers approved
- ✅ Frontend updated and restarted
- ✅ Test payment successful
- ✅ Transaction visible on block explorer

---

## 📞 Support

If you encounter issues:
1. Check contract on: https://celo-sepolia.blockscout.com
2. Verify network configuration
3. Check console logs in browser
4. Ensure sufficient CELO balance

---

## 🔐 Security Notes

- ✅ Never commit private keys to git
- ✅ Use `.env.local` (already in `.gitignore`)
- ✅ Test on testnet before mainnet
- ✅ Keep admin private key secure
- ✅ Audit contract before production

---

## 🚀 Ready for Production?

When moving to Celo Mainnet:
1. Deploy to `celo` network (Chain ID: 42220)
2. Use real CELO (not testnet)
3. Audit smart contract
4. Update frontend to mainnet
5. Test thoroughly!

---

**Happy Deploying! 🎉**
