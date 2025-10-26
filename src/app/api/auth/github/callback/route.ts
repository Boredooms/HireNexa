import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect('/dashboard/github?error=no_code')
    }

    // Check Clerk authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.redirect('/sign-in')
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.redirect('/dashboard/github?error=oauth_failed')
    }

    const accessToken = tokenData.access_token

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    const githubUser = await userResponse.json()

    // Store GitHub connection in Supabase
    const supabase = createClient()
    
    await supabase.from('users').upsert({
      id: userId,
      email: githubUser.email || `${githubUser.login}@github.user`,
      full_name: githubUser.name || githubUser.login,
      bio: githubUser.bio || '',
      github_username: githubUser.login,
      avatar_url: githubUser.avatar_url,
    }, { onConflict: 'id' })

    // Store access token securely (optional - for future API calls)
    // You might want to encrypt this token before storing
    await supabase.from('github_connections').upsert({
      user_id: userId,
      github_username: githubUser.login,
      access_token: accessToken, // Consider encrypting this
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    // Redirect back to GitHub page with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/github?connected=true`)
  } catch (error) {
    console.error('Error in GitHub OAuth callback:', error)
    return NextResponse.redirect('/dashboard/github?error=callback_failed')
  }
}
