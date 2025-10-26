import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()

    // Check if skill exchange profile already exists
    const { data: existingProfile } = await supabase
      .from('skill_exchange_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingProfile) {
      return NextResponse.json({ 
        success: true, 
        profile: existingProfile,
        message: 'Profile already exists'
      })
    }

    // Get user's skills from main skills table
    const { data: userSkills } = await supabase
      .from('skills')
      .select('skill_name')
      .eq('user_id', userId)
      .limit(10)

    const skillsOffered = userSkills?.map(s => s.skill_name) || []

    // Get user's main profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    // Map career level to valid experience_level
    const mapExperienceLevel = (careerLevel: string | null): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
      if (!careerLevel) return 'intermediate'
      
      const level = careerLevel.toLowerCase()
      if (level.includes('junior') || level.includes('entry')) return 'beginner'
      if (level.includes('mid') || level.includes('intermediate')) return 'intermediate'
      if (level.includes('senior') || level.includes('lead')) return 'advanced'
      if (level.includes('principal') || level.includes('architect') || level.includes('expert')) return 'expert'
      
      return 'intermediate' // default
    }

    // Create skill exchange profile with existing data
    const { data: newProfile, error } = await supabase
      .from('skill_exchange_profiles')
      .insert({
        user_id: userId,
        name: user?.fullName || userProfile?.full_name || 'User',
        avatar_url: user?.imageUrl || userProfile?.avatar_url || '',
        bio: userProfile?.bio || userProfile?.professional_summary || 'Excited to exchange skills!',
        skills_offered: skillsOffered,
        skills_wanted: [], // User can update this
        interests: userProfile?.key_strengths || [],
        experience_level: mapExperienceLevel(userProfile?.career_level),
        availability: 'Available for skill exchange',
        online: true,
        last_active: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      // If profile already exists (duplicate key), fetch and return it
      if (error.code === '23505') {
        const { data: existingProfile } = await supabase
          .from('skill_exchange_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        return NextResponse.json({ 
          success: true, 
          profile: existingProfile,
          message: 'Profile already exists'
        })
      }
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      profile: newProfile,
      message: 'Profile created successfully from your existing data!'
    })
  } catch (error) {
    console.error('Error auto-creating profile:', error)
    return NextResponse.json({ 
      error: 'Failed to create profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
