import { NextResponse } from 'next/server'
import { JsonRpcProvider } from 'ethers'

export async function GET() {
  try {
    const escrowAddress = process.env.NEXT_PUBLIC_ASSIGNMENT_ESCROW_ADDRESS!
    
    // Check on BOTH networks
    const results: any = {
      address: escrowAddress,
      networks: {}
    }
    
    // 1. Check Celo Sepolia
    try {
      const sepoliaProvider = new JsonRpcProvider('https://forno.celo-sepolia.celo-testnet.org')
      const sepoliaCode = await sepoliaProvider.getCode(escrowAddress)
      const sepoliaNetwork = await sepoliaProvider.getNetwork()
      
      results.networks.celoSepolia = {
        rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
        chainId: sepoliaNetwork.chainId.toString(),
        contractExists: sepoliaCode !== '0x',
        bytecodeLength: sepoliaCode.length,
        explorerUrl: `https://celo-sepolia.blockscout.com/address/${escrowAddress}`
      }
    } catch (error: any) {
      results.networks.celoSepolia = {
        error: error.message
      }
    }
    
    // 2. Check Alfajores
    try {
      const alfajoresProvider = new JsonRpcProvider('https://alfajores-forno.celo-testnet.org')
      const alfajoresCode = await alfajoresProvider.getCode(escrowAddress)
      const alfajoresNetwork = await alfajoresProvider.getNetwork()
      
      results.networks.alfajores = {
        rpcUrl: 'https://alfajores-forno.celo-testnet.org',
        chainId: alfajoresNetwork.chainId.toString(),
        contractExists: alfajoresCode !== '0x',
        bytecodeLength: alfajoresCode.length,
        explorerUrl: `https://alfajores.celoscan.io/address/${escrowAddress}`
      }
    } catch (error: any) {
      results.networks.alfajores = {
        error: error.message
      }
    }
    
    // Determine where contract actually is
    const onSepolia = results.networks.celoSepolia?.contractExists
    const onAlfajores = results.networks.alfajores?.contractExists
    
    results.diagnosis = {
      deployedTo: onSepolia ? 'Celo Sepolia' : onAlfajores ? 'Alfajores' : 'Neither network',
      recommendation: onSepolia 
        ? '✅ Contract is on Celo Sepolia - use RPC: https://forno.celo-sepolia.celo-testnet.org'
        : onAlfajores
        ? '⚠️ Contract is on Alfajores - update .env.local to use: https://alfajores-forno.celo-testnet.org'
        : '❌ Contract not found on either network - needs redeployment'
    }
    
    return NextResponse.json(results, { status: 200 })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
