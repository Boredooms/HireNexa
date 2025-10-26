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

    const { skill, confidence, evidence, walletAddress } = await request.json()

    if (!skill || !confidence || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Upload evidence to IPFS
    let evidenceIpfs = ''
    if (evidence) {
      evidenceIpfs = await ipfsService.uploadEvidence({
        type: 'github',
        data: evidence,
      })
    }

    // Attest skill on blockchain
    const txResult = await celoService.attestSkill({
      userAddress: walletAddress,
      skill,
      confidence,
      evidenceIpfs,
    })

    // Store in database
    const { data: attestation, error: dbError } = await supabase
      .from('skill_attestations')
      .insert({
        user_id: user.id,
        skill_name: skill,
        confidence_score: confidence,
        evidence_ipfs: evidenceIpfs,
        source: 'manual',
        tx_hash: txResult.txHash,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save attestation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      attestation,
      txHash: txResult.txHash,
      explorerUrl: `https://explorer.celo.org/alfajores/tx/${txResult.txHash}`,
    })
  } catch (error) {
    console.error('Error attesting skill:', error)
    return NextResponse.json(
      { error: 'Failed to attest skill' },
      { status: 500 }
    )
  }
}
