import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check Clerk authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.redirect('/sign-in')
    }

    // GitHub OAuth configuration
    const clientId = process.env.GITHUB_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
    
    // GitHub OAuth URL
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,repo`

    return NextResponse.redirect(githubAuthUrl)
  } catch (error) {
    console.error('Error initiating GitHub OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate GitHub OAuth' },
      { status: 500 }
    )
  }
}
