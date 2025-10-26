import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check Clerk authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Fetch user profile (userId IS the primary key now)
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ portfolio: null })
    }

    // users.id IS the Clerk ID (simplified schema)
    
    const { data: skills } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId)
      .order('confidence_score', { ascending: false })

    // Fetch all projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('stars', { ascending: false })

    // Fetch featured/best projects
    const { data: featuredProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_featured', true)
      .order('stars', { ascending: false })

    // Fetch skill recommendations
    const { data: recommendations } = await supabase
      .from('skill_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true })

    // Combine data
    const portfolio = {
      ...user,
      skills: skills || [],
      projects: projects || [],
      featuredProjects: featuredProjects || [],
      recommendations: recommendations || [],
    }

    return NextResponse.json({ portfolio })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}
