require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config({ path: '.env.local' })

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    // Celo Sepolia Testnet (Primary - Best faucets!)
    celoSepolia: {
      url: 'https://forno.celo-sepolia.celo-testnet.org',
      accounts: process.env.CELO_PRIVATE_KEY ? [process.env.CELO_PRIVATE_KEY] : [],
      chainId: 11142220,
      gas: 'auto',
      gasPrice: 'auto',
    },
    // Celo Sepolia with hyphen (alternative name)
    'celo-sepolia': {
      url: 'https://forno.celo-sepolia.celo-testnet.org',
      accounts: process.env.CELO_PRIVATE_KEY ? [process.env.CELO_PRIVATE_KEY] : [],
      chainId: 11142220,
      gas: 'auto',
      gasPrice: 'auto',
    },
    // Celo Alfajores (Backup)
    alfajores: {
      url: 'https://alfajores-forno.celo-testnet.org',
      accounts: process.env.CELO_PRIVATE_KEY ? [process.env.CELO_PRIVATE_KEY] : [],
      chainId: 44787,
    },
    // Celo Mainnet (Production)
    celo: {
      url: 'https://forno.celo.org',
      accounts: process.env.CELO_PRIVATE_KEY ? [process.env.CELO_PRIVATE_KEY] : [],
      chainId: 42220,
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
}
