import { auth } from '@clerk/nextjs/server'
import { portfolioGenerator } from '@/lib/portfolio/generator'
import { multiAgentOrchestrator } from '@/lib/ai/multi-agent-system'
import { webResearchAgent } from '@/lib/ai/web-research-agent'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    console.log('🔍 GitHub sync API called')
    
    // Check Clerk authentication
    const { userId } = await auth()

    console.log('👤 Clerk User ID:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { githubUsername } = body

    console.log('📝 GitHub username:', githubUsername)

    if (!githubUsername) {
      return NextResponse.json(
        { error: 'GitHub username is required' },
        { status: 400 }
      )
    }

    // Retrieve the GitHub OAuth access token from Supabase
    const supabase = createClient()
    const { data: connection, error: connectionError } = await supabase
      .from('github_connections')
      .select('access_token')
      .eq('user_id', userId)
      .single()

    if (connectionError || !connection?.access_token) {
      console.error('❌ No GitHub connection found for user:', userId, connectionError)
      return NextResponse.json(
        { error: 'GitHub account not connected. Please connect your GitHub account first.' },
        { status: 400 }
      )
    }

    console.log('✅ GitHub access token retrieved from database')
    console.log('🚀 Starting Multi-Agent GitHub Analysis...')

    // Use multi-agent system for comprehensive analysis
    const result = await portfolioGenerator.syncGitHubWithMultiAgent(
      userId,
      githubUsername,
      multiAgentOrchestrator,
      webResearchAgent,
      connection.access_token // Pass the OAuth access token
    )

    console.log('✅ Multi-Agent Analysis Complete!')
    console.log('📊 Trust Score:', result.trustScore)
    console.log('🤖 AI Code Percentage:', result.aiCodePercentage)
    console.log('📝 Skills Extracted:', result.skillsCount)
    console.log('💾 IPFS hash:', result.ipfsHash)
    if (result.requiresMinting) {
      console.log('💡 NFT minting required. Metadata:', result.nftMetadataHash)
    }

    return NextResponse.json({
      success: true,
      ipfsHash: result.ipfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.ipfsHash}`,
      nftMetadataHash: result.nftMetadataHash,
      requiresMinting: result.requiresMinting,
      nftMinted: result.nftMinted,
      // Multi-agent analysis results
      analysis: {
        trustScore: result.trustScore,
        aiCodePercentage: result.aiCodePercentage,
        skillsCount: result.skillsCount,
        careerLevel: result.careerLevel,
        agentResults: result.agentResults
      }
    })
  } catch (error: any) {
    console.error('❌ Error syncing GitHub:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json(
      { 
        error: 'Failed to sync GitHub data',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
