import { createClient } from '@/lib/supabase/server'
import { celoService } from '@/lib/celo/service'
import { ipfsService } from '@/lib/ipfs/pinata'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { credentialType, walletAddress, metadata } = await request.json()

    if (!credentialType || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create credential metadata
    const credentialMetadata = {
      name: `HireNexa ${credentialType}`,
      description: `Blockchain-verified ${credentialType} credential`,
      image: 'https://hirenexa.com/credential-badge.png',
      attributes: [
        {
          trait_type: 'Credential Type',
          value: credentialType,
        },
        {
          trait_type: 'Issued By',
          value: 'HireNexa',
        },
        {
          trait_type: 'Issue Date',
          value: new Date().toISOString(),
        },
        ...(metadata?.attributes || []),
      ],
    }

    // Upload metadata to IPFS
    const metadataIpfs = await ipfsService.uploadCredentialMetadata(
      credentialMetadata
    )

    // Issue credential NFT on blockchain
    const txResult = await celoService.issueCredential({
      recipientAddress: walletAddress,
      credentialType,
      metadataIpfs,
    })

    // Store in database
    const { data: credential, error: dbError } = await supabase
      .from('credentials')
      .insert({
        user_id: user.id,
        token_id: txResult.tokenId,
        credential_type: credentialType,
        metadata_ipfs: metadataIpfs,
        tx_hash: txResult.txHash,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save credential' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      credential,
      tokenId: txResult.tokenId,
      txHash: txResult.txHash,
      metadataUrl: ipfsService.getGatewayUrl(metadataIpfs),
      explorerUrl: `https://explorer.celo.org/alfajores/tx/${txResult.txHash}`,
    })
  } catch (error) {
    console.error('Error issuing credential:', error)
    return NextResponse.json(
      { error: 'Failed to issue credential' },
      { status: 500 }
    )
  }
}
