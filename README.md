<<<<<<< HEAD
# 🚀 HireNexa - Blockchain-Powered AI Portfolio Platform

> **Celo-Native** • **AI-Powered** • **NFT Credentials** • **Auto-Updating Portfolios**

A revolutionary recruitment platform that combines blockchain verification, AI analysis, and encrypted portfolio NFTs. Built on Celo blockchain with automatic GitHub analysis, skill attestation, and updatable portfolio NFTs.

[![Built with Celo](https://img.shields.io/badge/Built%20with-Celo-35D07F?style=flat&logo=celo)](https://celo.org)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat&logo=solidity)](https://soliditylang.org/)

---

## ✨ Key Features

### 👥 Multi-Role Platform

HireNexa supports **4 distinct user roles** with unique workflows:

#### **Students/Developers** (Default Role)
- Complete assignments to earn CELO
- Build verifiable portfolio NFTs
- Get skills verified by peers
- Exchange skills with others
- Apply for jobs
- **No deposit required**

#### **Recruiters** (Requires Application + Deposit)
- Post assignments with CELO rewards
- Review submissions
- Access verified portfolios
- Hire based on proven skills
- **Requirements:**
  - Apply via `/dashboard/recruiter/apply`
  - Admin approval required
  - 10 celo sepolia testnet deposit (9.5 celo sepolia testnet refunded)
  - 0.5 celo sepolia testnet platform fee

#### **Peer Reviewers/Verifiers** (Requires Application + Deposit)
- Verify developer skills
- Earn 4.5 celo sepolia testnet per verification
- Build reputation score
- Access to verification dashboard
- **Requirements:**
  - Apply via `/dashboard/peer-review/apply`
  - Admin approval required
  - 5 celo sepolia testnet deposit
  - Earn from verifications

#### **Admins** (Platform Managers)
- Approve/reject recruiter applications
- Approve/reject verifier applications
- Manage platform users
- Monitor escrow contracts
- Handle disputes
- Platform analytics

### 🔐 Blockchain Credentials
- **NFT-Based Credentials** - Tamper-proof ERC-721 certificates on Celo
- **Skill Attestation** - On-chain verification with confidence scoring
- **Smart Contracts Deployed** - SkillsRegistry & CredentialIssuer on Celo Sepolia
- **Real-time Events** - Live blockchain transaction monitoring

### 🎨 Auto-Updating Portfolio NFTs
- **Automatic Minting** - NFT created automatically after first GitHub sync
- **3-6 Month Updates** - Smart contract enforces update intervals
- **MetaMask Notifications** - Live progress updates during minting
- **Version Tracking** - Blockchain tracks all portfolio versions
- **Weekly Cron Checks** - Automatic update availability notifications

### 🤖 AI-Powered Analysis
- **Gemini AI Integration** - FREE and unlimited code analysis
- **Hugging Face Models** - Skill extraction and confidence scoring
- **GitHub Sync** - Automatic repository analysis
- **Smart Project Selection** - AI picks your 3 best projects
- **Professional Summaries** - Auto-generated career profiles

### 🔒 Military-Grade Security
- **AES-256-GCM Encryption** - All portfolio data encrypted
- **IPFS Storage** - Immutable, decentralized storage via Pinata
- **User-Controlled Sharing** - Time-limited, revocable access
- **Privacy by Default** - Only you control who sees your data
- **Blockchain Signatures** - ECDSA verification for credentials

### 🔄 Skill Exchange (Barter System)
- **Peer-to-Peer Learning** - Exchange skills with other developers
- **Automated Matching** - Platform matches complementary skills
- **Escrow Protection** - 2 celo sepolia testnet deposit per user (refunded on completion)
- **Video Integration** - Built-in video calls via Zego Cloud
- **Mutual Certificates** - Both users receive NFT certificates
- **Example:** "I teach React, I want to learn Python" ↔ "I teach Python, I want to learn React"

### 💼 Assignment-Based Hiring
- **Real Skill Testing** - Prove skills through actual assignments
- **CELO Rewards** - Earn cryptocurrency for completed work
- **Smart Contract Escrow** - Funds held securely until completion
- **NFT Certificates** - Receive certificates for completed assignments
- **Platform Fee** - 5% on assignment rewards
- **Automatic Payment** - Smart contract releases payment to winner

### 🔍 Peer-to-Peer Skill Verification
- **On-Chain Verification** - Skills verified and recorded on blockchain
- **Confidence Scoring** - 0-100 score based on evidence
- **Earn While Verifying** - 4.5 celo sepolia testnet per verification
- **Reputation System** - Build credibility as a verifier
- **Evidence-Based** - Review actual code and projects
- **Dispute Resolution** - Built-in dispute handling

### 🌐 Multi-Platform Integration
- **Clerk Authentication** - Secure user management
- **MetaMask Wallet** - Web3 wallet connection
- **GitHub Integration** - Automatic repo syncing
- **Supabase Database** - Real-time data storage with RLS
- **Vercel Deployment** - Production-ready hosting + cron jobs
- **TalkJS** - Real-time messaging
- **Zego Cloud** - Video calls for skill exchange
- **Agora** - Alternative video solution

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HIRENEXA PLATFORM                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   FRONTEND       │         │   BLOCKCHAIN     │
│  Next.js 14      │◄───────►│  Celo Sepolia    │
│  React + TS      │         │  Smart Contracts │
└────────┬─────────┘         └──────────────────┘
         │
         ├─→ Clerk Auth
         ├─→ MetaMask
         └─→ GitHub OAuth
         │
         ↓
┌──────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js)                       │
├──────────────────────────────────────────────────────────────┤
│ • /api/github/sync - GitHub analysis                         │
│ • /api/skills/attest - Skill attestation                     │
│ • /api/credentials/issue - NFT issuance                      │
│ • /api/portfolio/generate - Portfolio generation             │
│ • /api/portfolio/mint-nft - Auto NFT minting                │
│ • /api/cron/check-updates - Weekly update checks            │
└──────────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────┐
         ↓                                         ↓
┌──────────────────────┐              ┌──────────────────────┐
│   AI SERVICES        │              │   STORAGE            │
├──────────────────────┤              ├──────────────────────┤
│ • Gemini AI (FREE)   │              │ • Supabase DB        │
│ • Hugging Face       │              │ • Pinata IPFS        │
│ • Code Analysis      │              │ • AES-256 Encrypted  │
│ • Skill Extraction   │              │ • Blockchain Hashes  │
└──────────────────────┘              └──────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- GitHub account
- Git

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd hirenexa
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env.local` and configure:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Celo Blockchain
NEXT_PUBLIC_CELO_NETWORK=sepolia
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CELO_PRIVATE_KEY=your_private_key

# Smart Contracts (Already Deployed)
NEXT_PUBLIC_SKILLS_REGISTRY_SEPOLIA=0xfeD3737f8D6Ba8b827208d0F535d90812000c191
NEXT_PUBLIC_CREDENTIAL_ISSUER_SEPOLIA=0x62acD248A4349A6E9bFE5a594D8c3fA4D8A59e5b

# Pinata IPFS
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=gateway.pinata.cloud

# AI Services (FREE!)
GEMINI_API_KEY=your_gemini_key
HUGGINGFACE_API_KEY=your_hf_key

# GitHub Integration
GITHUB_TOKEN=your_github_token

# Encryption (Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_64_hex_character_key

# Cron Job Secret
CRON_SECRET=your_random_secret
```

### 3. Database Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push
```

### 4. Deploy Smart Contracts (Optional - Already Deployed)
```bash
# Get testnet CELO from faucet
# Visit: https://faucet.celo.org/sepolia

# Compile contracts
npx hardhat compile

# Deploy to Celo Sepolia
npx hardhat run scripts/deploy-sepolia.js --network celoSepolia
```

### 5. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
hirenexa/
├── contracts/                    # Solidity smart contracts
│   ├── SkillsRegistry.sol       # Skill attestation contract
│   ├── CredentialIssuer.sol     # NFT credential minting
│   └── UpdatablePortfolioNFT.sol # Auto-updating portfolio NFTs
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/             # Authentication pages
│   │   ├── api/                # API routes
│   │   │   ├── github/         # GitHub integration
│   │   │   ├── portfolio/      # Portfolio generation
│   │   │   ├── skills/         # Skill attestation
│   │   │   ├── credentials/    # NFT credentials
│   │   │   └── cron/           # Auto-update checks
│   │   └── dashboard/          # Protected dashboard
│   │       ├── celo/           # Blockchain features
│   │       ├── github/         # GitHub sync
│   │       ├── portfolio/      # Portfolio view
│   │       └── nft/            # NFT management
│   │
│   ├── lib/                    # Core services
│   │   ├── ai/                 # AI analysis
│   │   │   ├── gemini.ts       # Gemini AI service
│   │   │   ├── huggingface.ts  # Hugging Face models
│   │   │   └── skill-analyzer.ts # Skill extraction
│   │   ├── celo/               # Blockchain integration
│   │   │   ├── service.ts      # Contract interactions
│   │   │   ├── client-service.ts # Client-side Web3
│   │   │   └── config.ts       # Network config
│   │   ├── encryption/         # AES-256-GCM encryption
│   │   ├── ipfs/               # Pinata IPFS service
│   │   ├── portfolio/          # Portfolio generation
│   │   │   ├── generator.ts    # Auto-mint logic
│   │   │   └── auto-updater.ts # Update scheduler
│   │   ├── web3/               # Web3 utilities
│   │   ├── integrations/       # GitHub integration
│   │   └── supabase/           # Database clients
│   │
│   └── components/             # React components
│       ├── auth/               # Auth components
│       ├── celo/               # Blockchain UI
│       ├── github/             # GitHub sync UI
│       └── portfolio/          # Portfolio display
│
├── supabase/
│   └── migrations/             # Database migrations
│       ├── 001_initial_schema.sql
│       ├── FIX_SCHEMA.sql
│       └── add_unique_constraints.sql
│
├── scripts/                    # Deployment scripts
│   ├── deploy-sepolia.js       # Deploy to Celo Sepolia
│   ├── deploy-portfolio-nft.js # Deploy portfolio NFT
│   └── check-balance.js        # Check wallet balance
│
├── docs/                       # Comprehensive documentation
│   ├── COMPLETE_ARCHITECTURE.md
│   ├── COMPLETE_PORTFOLIO_NFT_SYSTEM.md
│   ├── FINAL_IMPLEMENTATION_STATUS.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── SETUP_GUIDE.md
│
├── hardhat.config.js           # Hardhat configuration
├── next.config.js              # Next.js configuration
├── vercel.json                 # Vercel deployment + cron
└── package.json                # Dependencies
```

---

## 🔗 Deployed Smart Contracts

### Celo Sepolia Testnet
- **Network**: Celo Sepolia
- **Chain ID**: 11142220
- **Explorer**: https://celo-sepolia.blockscout.com

**Contracts**:
- **SkillsRegistry**: `0xfeD3737f8D6Ba8b827208d0F535d90812000c191`
- **CredentialIssuer**: `0x62acD248A4349A6E9bFE5a594D8c3fA4D8A59e5b`

---

## 🎯 Core Features Explained

### 1. Automatic Portfolio NFT Minting

**How It Works**:
```
User connects GitHub → Gemini analyzes repos → User connects MetaMask
→ System automatically mints NFT → User sees "✅ Portfolio NFT minted!"
```

**No manual action needed!** The system handles everything automatically.

## 🔄 Complete System Workflow

### **Student/Developer Journey**

1. **Sign Up & GitHub Sync**
   - Register with Clerk authentication
   - Connect GitHub account
   - Gemini AI analyzes all repositories
   - Extracts 15-25+ skills automatically
   - Generates professional summary
   - Selects 3 best projects

2. **Portfolio NFT Creation**
   - Connect MetaMask wallet
   - System encrypts portfolio data (AES-256-GCM)
   - Uploads to IPFS via Pinata
   - Automatically mints NFT on Celo blockchain
   - NFT contains encrypted IPFS hash
   - Version 1 created

3. **Skill Verification**
   - Request verification for specific skills
   - Peer reviewers accept requests
   - Reviewers analyze code/projects
   - Assign confidence score (0-100)
   - Verification recorded on-chain
   - Reviewer earns 4.5 celo sepolia testnet

4. **Complete Assignments**
   - Browse available assignments
   - Submit solutions
   - Recruiter reviews submissions
   - Winner selected
   - Smart contract releases payment
   - Receive NFT certificate

5. **Portfolio Updates (Every 3-6 Months)**
   - Weekly cron job checks eligibility
   - Notification sent when update available
   - Click "Update Portfolio"
   - System re-analyzes GitHub
   - New skills added
   - NFT updated to next version

### **Recruiter Journey**

1. **Application Process**
   - Apply via `/dashboard/recruiter/apply`
   - Fill company information
   - Submit motivation statement
   - Admin reviews application

2. **Approval & Deposit**
   - Admin approves application
   - Deposit 10 celo sepolia testnet to RecruiterEscrow
   - Platform fee: 0.5 celo sepolia testnet
   - Refund: 9.5 celo sepolia testnet
   - Role changed to 'recruiter'

3. **Post Assignments**
   - Create assignment with details
   - Set reward amount in CELO
   - Funds locked in escrow
   - Assignment published

4. **Review & Select**
   - Review all submissions
   - Select winner
   - Smart contract releases payment
   - Winner receives NFT certificate

### **Peer Reviewer Journey**

1. **Application Process**
   - Apply via `/dashboard/peer-review/apply`
   - Select expertise areas
   - Submit experience details
   - Admin reviews application

2. **Approval & Deposit**
   - Admin approves application
   - Deposit 5 celo sepolia testnet to PeerReviewEscrow
   - Role changed to 'verifier'
   - Can now verify skills

3. **Verify Skills**
   - Accept verification requests
   - Review code and projects
   - Assign confidence score
   - Submit verification
   - Earn 4.5 celo sepolia testnet per verification
   - Build reputation score

### **Admin Journey**

1. **Review Applications**
   - Access admin dashboard
   - View pending recruiter applications
   - View pending verifier applications

2. **Approve/Reject**
   - Review application details
   - Approve: Update role, grant permissions
   - Reject: Store reason, allow reapply after 7 days

3. **Monitor Platform**
   - Track user statistics
   - Monitor transaction volumes
   - Handle disputes
   - Manage platform fees

### 2. Auto-Update System (3-6 Months)

**Smart Contract Enforced**:
- Minimum update interval: **90 days (3 months)**
- Maximum recommended: **180 days (6 months)**
- Blockchain prevents updates before 3 months

**Weekly Cron Job**:
```typescript
// Runs every Sunday at midnight
// Checks all portfolios for update eligibility
// Sends notifications to users
```

**User Flow**:
1. Week 13 (Day 91): System detects update available
2. User receives notification: "🔔 Portfolio Update Available!"
3. User clicks "Update Now"
4. MetaMask confirmation
5. NFT updated to Version 2

### 3. Military-Grade Encryption

**Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV**: Random 16 bytes per encryption
- **Authentication**: Built-in auth tag (tamper detection)

**What's Encrypted**:
- All portfolio data
- Skills and evidence
- Projects and descriptions
- Personal information
- Certifications

**Nobody Can Decrypt Without Your Key**:
- ❌ Not the blockchain
- ❌ Not IPFS
- ❌ Not HireNexa
- ✅ **ONLY YOU**

### 4. User-Controlled Sharing

**Privacy Controls**:
- ✅ Default Private - Nobody can view except you
- ✅ Explicit Sharing - You must grant access
- ✅ Time-Limited - Auto-expires (7-365 days)
- ✅ Instant Revocation - Revoke access anytime
- ✅ Blockchain Recorded - All sharing on-chain

**Sharing Process**:
```typescript
// Grant access to recruiter for 30 days
await portfolioNFTService.grantSharingPermission(
  tokenId: 12345,
  sharedWith: "0x1234...abcd",
  duration: 30 // days
)

// Revoke access anytime
await portfolioNFTService.revokeSharingPermission(
  tokenId: 12345,
  revokeFrom: "0x1234...abcd"
)
```

---

## 📜 Smart Contracts Overview

HireNexa uses **11 Solidity smart contracts** deployed on Celo blockchain:

### Core Contracts

1. **SkillsRegistry.sol** - Store skill attestations on-chain
   - Authorized attestors
   - Confidence scoring (0-100)
   - IPFS evidence links
   - Revocation capability

2. **CredentialIssuer.sol** - Issue NFT credentials
   - ERC-721 standard
   - Metadata on IPFS
   - Revocable credentials

3. **UpdatablePortfolioNFT.sol** - Auto-updating portfolio NFTs
   - 90-day minimum update interval
   - Encrypted IPFS storage
   - Sharing permissions
   - Version tracking

### Assignment & Hiring Contracts

4. **AssignmentEscrow.sol** - Manage assignment payments
   - Escrow holds funds
   - Automatic payment release
   - Platform fee: 5%
   - NFT certificate issuance

5. **AssignmentCertificate.sol** - Issue completion certificates
   - ERC-721 NFT
   - Assignment linkage
   - Metadata storage

6. **JobMarketplace.sol** - Full-time job postings
   - Job listings
   - Application tracking
   - Escrow for deposits

### Multi-Role System Contracts

7. **RecruiterEscrow.sol** - Manage recruiter applications
   - 10 cUSD deposit required
   - Platform fee: 5% (0.5 cUSD)
   - Refund on approval: 9.5 cUSD
   - Refund on rejection: 10 cUSD

8. **PeerReviewEscrow.sol** - Manage peer reviewer applications
   - 5 cUSD deposit required
   - Verification reward: 5 cUSD
   - Platform fee: 10% (0.5 cUSD)
   - Reviewer earns: 4.5 cUSD per verification

### Skill Exchange Contracts

9. **SkillBarterEscrow.sol** - Facilitate skill exchanges
   - 2 cUSD deposit per user
   - Refunded on completion
   - NFT certificates for both
   - Automated matching

10. **LightweightSkillBarterEscrow.sol** - Simplified exchanges
    - Minimal gas costs
    - Quick exchanges

11. **SkillVerification.sol** - Comprehensive verification system
    - Multi-step verification
    - Reputation tracking
    - Reward distribution
    - Dispute handling

### Deployed Addresses (Celo Sepolia)

- **SkillsRegistry**: `0xfeD3737f8D6Ba8b827208d0F535d90812000c191`
- **CredentialIssuer**: `0x62acD248A4349A6E9bFE5a594D8c3fA4D8A59e5b`

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- Supabase user ID
  clerk_id TEXT UNIQUE,             -- Clerk authentication ID
  wallet_address TEXT,              -- MetaMask wallet
  github_username TEXT,
  email TEXT,
  full_name TEXT,
  bio TEXT,
  professional_summary TEXT,
  career_level TEXT,
  key_strengths TEXT[],
  created_at TIMESTAMP
);
```

### Skills Table
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  skill_name TEXT NOT NULL,
  confidence_score INTEGER,         -- 0-100
  category TEXT,                    -- language|framework|tool
  level TEXT,                       -- beginner|intermediate|advanced|expert
  source TEXT,                      -- github|linkedin|manual
  evidence TEXT[],
  verified_at TIMESTAMP,
  revoked BOOLEAN DEFAULT false
);
```

### Portfolios Table
```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  ipfs_hash TEXT NOT NULL,          -- Encrypted data on IPFS
  nft_token_id INTEGER,             -- NFT token ID on Celo
  blockchain_tx_hash TEXT,          -- Minting transaction
  wallet_address TEXT,              -- Owner's wallet
  version INTEGER DEFAULT 1,        -- Portfolio version
  auto_update_enabled BOOLEAN,      -- Auto-update on/off
  last_sync_at TIMESTAMP
);
```

### Credentials Table
```sql
CREATE TABLE credentials (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  credential_type TEXT,
  title TEXT,
  metadata_ipfs TEXT,               -- Encrypted metadata
  blockchain_tx_hash TEXT,
  nft_token_id TEXT,
  issued_at TIMESTAMP,
  revoked BOOLEAN DEFAULT false
);
```

---

## 🔧 API Endpoints

### GitHub Integration
```typescript
POST /api/github/sync
// Syncs GitHub repos and analyzes with AI
// Returns: skills, projects, summary

GET /api/github/check-connection
// Checks GitHub connection status
```

### Portfolio Management
```typescript
POST /api/portfolio/generate
// Generates encrypted portfolio and mints NFT
// Returns: ipfsHash, tokenId, txHash

GET /api/portfolio/view
// Retrieves and decrypts portfolio
// Returns: portfolio data

POST /api/portfolio/mint-nft
// Manually mint portfolio NFT
// Returns: tokenId, txHash
```

### Skill Attestation
```typescript
POST /api/skills/attest
// Attests skill on blockchain
// Returns: txHash, attestationId

GET /api/skills/cleanup
// Removes duplicate skills
```

### Credentials
```typescript
POST /api/credentials/issue
// Issues NFT credential
// Returns: tokenId, txHash, metadataIpfs
```

### Cron Jobs
```typescript
GET /api/cron/check-updates
// Weekly check for portfolio updates
// Requires: Authorization header with CRON_SECRET
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **React** - UI library

### Blockchain
- **Celo** - EVM-compatible blockchain
- **Solidity 0.8.20** - Smart contract language
- **Hardhat** - Development environment
- **ethers.js 6.15** - Web3 library
- **MetaMask** - Wallet integration

### Backend Services
- **Clerk** - Authentication
- **Supabase** - PostgreSQL database
- **Pinata** - IPFS storage
- **Vercel** - Hosting + cron jobs

### AI Services
- **Gemini AI** - FREE code analysis
- **Hugging Face** - Skill extraction
- **OpenAI** - Fallback AI service

### Security
- **AES-256-GCM** - Encryption
- **ECDSA** - Blockchain signatures
- **JWT** - API authentication
- **RLS** - Row Level Security

---

## 📊 Cost Breakdown

### Development (0-6 months): **$0-15/month**

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Supabase** | Free | $0 | 500MB DB, 50K MAU |
| **Vercel** | Hobby | $0 | Unlimited personal projects |
| **Pinata** | Free | $0 | 1GB storage, 10GB bandwidth |
| **Celo Sepolia** | Testnet | $0 | Unlimited transactions |
| **Gemini AI** | Free | $0 | Unlimited requests |
| **Clerk** | Free | $0 | 10K MAU |
| **Domain** | Annual | ~$1/mo | Optional |

**Total: ~$0-15/month**

### Production (Ready for users): **$70-100/month**

- Supabase Pro: $25/month (8GB, better performance)
- Pinata Growth: $20/month (100GB storage)
- Celo Mainnet: ~$5/month (minimal gas costs)
- Vercel Pro: $20/month (team features)
- Clerk Pro: $25/month (unlimited MAU)

**Total: $95/month for thousands of users**

---

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Vercel automatically**:
- Sets up cron job (weekly on Sunday)
- Runs `/api/cron/check-updates` every week
- Checks for portfolios due for update

### Deploy Smart Contracts

```bash
# Compile
npx hardhat compile

# Deploy to Celo Sepolia
npx hardhat run scripts/deploy-sepolia.js --network celoSepolia

# Update .env.local with contract addresses
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run contract tests
npx hardhat test

# Check TypeScript
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build
```

---

## 📚 Documentation

Comprehensive documentation available in `/docs`:

- **[COMPLETE_ARCHITECTURE.md](./docs/COMPLETE_ARCHITECTURE.md)** - System architecture
- **[COMPLETE_PORTFOLIO_NFT_SYSTEM.md](./docs/COMPLETE_PORTFOLIO_NFT_SYSTEM.md)** - NFT system details
- **[FINAL_IMPLEMENTATION_STATUS.md](./docs/FINAL_IMPLEMENTATION_STATUS.md)** - Implementation status
- **[DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)** - Setup walkthrough
- **[QUICK_START.md](./docs/QUICK_START.md)** - Quick start guide

---

## 🎯 Roadmap

### ✅ Phase 1: MVP (COMPLETED)
- [x] Clerk + Supabase authentication
- [x] Celo smart contracts deployed
- [x] IPFS portfolio storage
- [x] AI skill verification (Gemini + Hugging Face)
- [x] GitHub integration
- [x] Auto-minting portfolio NFTs
- [x] Auto-update system (3-6 months)
- [x] MetaMask notifications
- [x] User-controlled sharing
- [x] AES-256-GCM encryption

### 🚧 Phase 2: Growth (IN PROGRESS)
- [ ] LinkedIn integration
- [ ] Job matching algorithm
- [ ] Recruiter dashboard
- [ ] Application tracking
- [ ] Email notifications
- [ ] Analytics dashboard

### 🔮 Phase 3: Scale (PLANNED)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Enterprise features
- [ ] Multi-chain support
- [ ] AI-powered job recommendations

---

## 🔐 Security Features

### Multi-Layer Security
1. **Authentication Layer** - Clerk handles user auth
2. **Encryption Layer** - AES-256-GCM for all sensitive data
3. **Blockchain Layer** - Immutable transaction records
4. **Access Control Layer** - User-controlled permissions

### Security Measures
- ✅ Row Level Security (RLS) on database
- ✅ JWT tokens for API routes
- ✅ ECDSA signatures for blockchain
- ✅ Random IV for each encryption
- ✅ Authentication tags for integrity
- ✅ Environment variable protection
- ✅ Time-limited access tokens
- ✅ Instant revocation capability

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 🆘 Support

- **Documentation**: Check `/docs` folder
- **GitHub Issues**: Report bugs and request features
- **Email**: support@hirenexa.com

---

## 🎉 What Makes HireNexa Special?

### ✅ Automatic Everything
- Auto-mints NFT after first GitHub sync
- Auto-checks for updates weekly
- Auto-notifies users when update available
- Auto-selects best projects with AI

### ✅ Blockchain-Verified
- Immutable credentials on Celo
- Verifiable on blockchain explorer
- Tamper-proof skill records
- Portable across platforms

### ✅ Privacy-First
- Military-grade encryption (AES-256-GCM)
- Default private portfolios
- User-controlled sharing
- Instant revocation

### ✅ AI-Powered
- Gemini AI code analysis (FREE!)
- Automatic skill extraction
- Confidence scoring
- Professional summaries

### ✅ Developer-Friendly
- Zero TypeScript errors
- Comprehensive documentation
- Clean codebase
- Production-ready

---

## 🌟 Star History

If you find HireNexa useful, please consider giving it a star! ⭐

---

**Built with ❤️ using Celo, Next.js, and AI**

**Your portfolio is now a verifiable, updatable, encrypted NFT that only you control!** 🚀
=======
