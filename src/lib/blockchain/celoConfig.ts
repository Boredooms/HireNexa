export const CELO_SEPOLIA_CONFIG = {
  chainId: 11142220,
  chainIdHex: '0xaa0dc',
  name: 'Celo Sepolia Testnet',
  rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
  blockExplorer: 'https://celo-sepolia.blockscout.com',
  nativeCurrency: {
    name: 'S-CELO',
    symbol: 'S-CELO',
    decimals: 18
  },
  contracts: {
    assignmentEscrow: process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS || '',
    assignmentCertificate: process.env.NEXT_PUBLIC_ASSIGNMENT_CERTIFICATE_ADDRESS || '',
    // Native S-CELO on Sepolia (wrapped)
    celoToken: process.env.NEXT_PUBLIC_CELO_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000'
  }
}
