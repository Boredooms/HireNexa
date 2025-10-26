import { portfolioAutoUpdater } from '@/lib/portfolio/auto-updater'
import { NextResponse } from 'next/server'

/**
 * Cron job endpoint for checking portfolio updates
 * Runs weekly to check if any portfolios are due for update
 * 
 * Schedule: Every Sunday at midnight (weekly)
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-updates",
 *     "schedule": "0 0 * * 0"
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🕐 Starting weekly portfolio update check...')

    // Run auto-update check
    await portfolioAutoUpdater.checkAndUpdateDuePortfolios()

    console.log('✅ Weekly portfolio update check completed')

    return NextResponse.json({
      success: true,
      message: 'Portfolio update check completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in portfolio update cron:', error)
    return NextResponse.json(
      {
        error: 'Failed to check portfolio updates',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// Allow POST as well (for manual testing)
export async function POST(request: Request) {
  return GET(request)
}
