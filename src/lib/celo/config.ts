import { newKit } from '@celo/contractkit'

// Celo network configuration
export const CELO_CONFIG = {
  sepolia: {
    rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
    chainId: 44787,
    explorer: 'https://celo-sepolia.blockscout.com',
    faucet: 'https://faucet.celo.org/sepolia',
  },
  alfajores: {
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    chainId: 44787,
    explorer: 'https://explorer.celo.org/alfajores',
    faucet: 'https://faucet.celo.org/alfajores',
  },
  mainnet: {
    rpcUrl: 'https://forno.celo.org',
    chainId: 42220,
    explorer: 'https://explorer.celo.org/mainnet',
  },
}

// Get the active network
export const getActiveNetwork = () => {
  const useMainnet = process.env.NEXT_PUBLIC_USE_MAINNET === 'true'
  const network = process.env.NEXT_PUBLIC_CELO_NETWORK || 'sepolia'
  
  if (useMainnet) return CELO_CONFIG.mainnet
  if (network === 'sepolia') return CELO_CONFIG.sepolia
  return CELO_CONFIG.alfajores
}

// Create ContractKit instance
export function createKit() {
  const network = getActiveNetwork()
  return newKit(network.rpcUrl)
}

// Contract addresses (will be populated after deployment)
export const CONTRACT_ADDRESSES = {
  sepolia: {
    skillsRegistry: process.env.NEXT_PUBLIC_SKILLS_REGISTRY_SEPOLIA || '',
    credentialIssuer: process.env.NEXT_PUBLIC_CREDENTIAL_ISSUER_SEPOLIA || '',
  },
  alfajores: {
    skillsRegistry: process.env.NEXT_PUBLIC_SKILLS_REGISTRY_TESTNET || '',
    credentialIssuer: process.env.NEXT_PUBLIC_CREDENTIAL_ISSUER_TESTNET || '',
  },
  mainnet: {
    skillsRegistry: process.env.NEXT_PUBLIC_SKILLS_REGISTRY_MAINNET || '',
    credentialIssuer: process.env.NEXT_PUBLIC_CREDENTIAL_ISSUER_MAINNET || '',
  },
}

export function getContractAddresses() {
  const useMainnet = process.env.NEXT_PUBLIC_USE_MAINNET === 'true'
  const network = process.env.NEXT_PUBLIC_CELO_NETWORK || 'sepolia'
  
  if (useMainnet) return CONTRACT_ADDRESSES.mainnet
  if (network === 'sepolia') return CONTRACT_ADDRESSES.sepolia
  return CONTRACT_ADDRESSES.alfajores
}
