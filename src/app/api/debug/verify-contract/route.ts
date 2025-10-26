import { NextResponse } from 'next/server'
import { JsonRpcProvider } from 'ethers'

export async function GET() {
  try {
    const escrowAddress = process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS!
    
    // Check on Celo Sepolia
    const provider = new JsonRpcProvider('https://forno.celo-sepolia.celo-testnet.org')
    
    // Get contract bytecode
    const code = await provider.getCode(escrowAddress)
    
    // Get network info
    const network = await provider.getNetwork()
    
    return NextResponse.json({
      address: escrowAddress,
      network: {
        name: network.name,
        chainId: network.chainId.toString(),
      },
      contractExists: code !== '0x',
      bytecodeLength: code.length,
      bytecode: code.substring(0, 100) + '...',
      diagnosis: code === '0x' 
        ? '❌ No contract found at this address on Celo Sepolia' 
        : '✅ Contract exists',
      explorerUrl: `https://celo-sepolia.blockscout.com/address/${escrowAddress}`,
      recommendation: code === '0x'
        ? 'The contract needs to be redeployed. Run: npx hardhat run scripts/deploy-assignment-contracts.js --network celoSepolia'
        : 'Contract exists but may have ABI mismatch'
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
