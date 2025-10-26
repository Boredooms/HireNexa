import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    // Get current user's profile
    const { data: currentUser } = await supabase
      .from('skill_exchange_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!currentUser) {
      return NextResponse.json({ 
        matches: [],
        message: 'Please complete your skill exchange profile first'
      })
    }

    // Get all other users
    let query = supabase
      .from('skill_exchange_profiles')
      .select('*')
      .neq('user_id', userId)

    if (filter === 'online') {
      query = query.eq('online', true)
    }

    const { data: allProfiles, error } = await query

    if (error) throw error

    // Calculate match scores and fetch barter status
    const matches = await Promise.all(allProfiles?.map(async (profile) => {
      const matchScore = calculateMatchScore(currentUser, profile)
      
      // Check if there's an active barter with this user
      const { data: barter } = await supabase
        .from('skill_barter_proposals')
        .select('id, status')
        .or(`and(proposer_id.eq.${userId},recipient_id.eq.${profile.user_id}),and(proposer_id.eq.${profile.user_id},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      return {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        skills_offered: profile.skills_offered || [],
        skills_wanted: profile.skills_wanted || [],
        interests: profile.interests || [],
        match_score: matchScore,
        online: profile.online || false,
        last_active: profile.last_active,
        bio: profile.bio,
        experience_level: profile.experience_level,
        availability: profile.availability,
        barter_status: barter?.status || 'none',
        barter_id: barter?.id
      }
    }) || [])

    // Sort by match score
    matches.sort((a, b) => b.match_score - a.match_score)

    // Apply top matches filter
    const filteredMatches = filter === 'top-matches' 
      ? matches.filter(m => m.match_score >= 70)
      : matches

    return NextResponse.json({ matches: filteredMatches })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}

function calculateMatchScore(user1: any, user2: any): number {
  let score = 0
  
  // Check if user1's wanted skills match user2's offered skills
  const wantedMatchesOffered = user1.skills_wanted?.filter((skill: string) =>
    user2.skills_offered?.includes(skill)
  ).length || 0
  
  // Check if user2's wanted skills match user1's offered skills
  const offeredMatchesWanted = user2.skills_wanted?.filter((skill: string) =>
    user1.skills_offered?.includes(skill)
  ).length || 0
  
  // Mutual skill exchange is highly valued
  const mutualExchange = wantedMatchesOffered > 0 && offeredMatchesWanted > 0
  
  // Calculate base score
  score += wantedMatchesOffered * 20
  score += offeredMatchesWanted * 20
  
  // Bonus for mutual exchange
  if (mutualExchange) {
    score += 30
  }
  
  // Interest overlap
  const commonInterests = user1.interests?.filter((interest: string) =>
    user2.interests?.includes(interest)
  ).length || 0
  score += commonInterests * 5
  
  // Cap at 100
  return Math.min(score, 100)
}
