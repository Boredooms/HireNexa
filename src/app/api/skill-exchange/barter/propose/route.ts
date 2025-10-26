import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📥 Received barter proposal:', body)
    
    const { 
      match_id, 
      blockchain_barter_id,
      blockchain_tx_hash,
      skill_offered, 
      skill_requested, 
      duration, 
      deposit_amount,
      description 
    } = body

    // Get the recipient's user_id from the match profile
    const { data: matchProfile, error: matchError } = await supabase
      .from('skill_exchange_profiles')
      .select('user_id')
      .eq('id', match_id)
      .single()

    if (matchError || !matchProfile) {
      console.error('❌ Match profile not found:', matchError)
      throw new Error('Match profile not found')
    }

    const recipientUserId = matchProfile.user_id
    console.log('📧 Recipient user_id:', recipientUserId)

    // Create barter proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('skill_barter_proposals')
      .insert({
        proposer_id: userId,
        recipient_id: recipientUserId, // Use actual user_id, not match_id
        blockchain_barter_id,
        blockchain_tx_hash,
        skill_offered,
        skill_requested,
        duration,
        deposit_amount,
        description,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (proposalError) {
      console.error('❌ Database error:', proposalError)
      throw proposalError
    }

    console.log('✅ Proposal created:', proposal.id)

    // Send notification to recipient
    await supabase
      .from('notifications')
      .insert({
        user_id: recipientUserId, // Use actual user_id
        type: 'barter_proposal',
        title: 'New Skill Barter Proposal',
        message: `Someone wants to exchange ${skill_offered} for ${skill_requested}`,
        data: { proposal_id: proposal.id },
        read: false,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true,
      proposal_id: proposal.id,
      message: 'Barter proposal sent successfully'
    })
  } catch (error) {
    console.error('Error creating barter proposal:', error)
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 })
  }
}
