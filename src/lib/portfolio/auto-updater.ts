import { createClient } from '@/lib/supabase/server'
import { portfolioGenerator } from './generator'
import { portfolioNFTService } from '@/lib/web3/portfolio-nft'
import { githubService } from '@/lib/integrations/github'

/**
 * Auto-Update Portfolio NFT Service
 * Automatically updates portfolio NFTs every 3-6 months with new skills
 */

export interface UpdateSchedule {
  userId: string
  tokenId: number
  lastUpdated: Date
  nextUpdateDue: Date
  autoUpdateEnabled: boolean
  walletAddress: string
}

export class PortfolioAutoUpdater {
  private readonly MIN_UPDATE_INTERVAL_DAYS = 90 // 3 months
  private readonly MAX_UPDATE_INTERVAL_DAYS = 180 // 6 months
  private readonly CHECK_INTERVAL_DAYS = 7 // Check weekly

  /**
   * Check and update portfolios that are due for update
   */
  async checkAndUpdateDuePortfolios(): Promise<void> {
    const supabase = createClient()

    console.log('🔄 Checking for portfolios due for update...')

    // Get all portfolios with auto-update enabled
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('*, users(github_username, clerk_id)')
      .eq('auto_update_enabled', true)
      .not('nft_token_id', 'is', null)

    if (!portfolios || portfolios.length === 0) {
      console.log('No portfolios with auto-update enabled')
      return
    }

    for (const portfolio of portfolios) {
      try {
        await this.checkAndUpdatePortfolio(portfolio)
      } catch (error) {
        console.error(`Failed to update portfolio ${portfolio.id}:`, error)
      }
    }
  }

  /**
   * Check if a specific portfolio needs update
   */
  private async checkAndUpdatePortfolio(portfolio: any): Promise<void> {
    const supabase = createClient()

    const lastUpdated = new Date(portfolio.last_sync_at || portfolio.created_at)
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))

    // Check if update is due (3 months minimum)
    if (daysSinceUpdate < this.MIN_UPDATE_INTERVAL_DAYS) {
      console.log(`Portfolio ${portfolio.id} not due for update yet (${daysSinceUpdate} days)`)
      return
    }

    console.log(`📅 Portfolio ${portfolio.id} is due for update (${daysSinceUpdate} days since last update)`)

    // Check if user has new GitHub activity
    const githubUsername = portfolio.users?.github_username
    if (!githubUsername) {
      console.log(`No GitHub username for portfolio ${portfolio.id}`)
      return
    }

    // Fetch latest GitHub data
    const githubProfile = await githubService.getUserProfile(githubUsername)

    // Check if there are new repos or significant changes
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('name')
      .eq('user_id', portfolio.user_id)

    const existingRepoNames = new Set(existingProjects?.map((p: any) => p.name) || [])
    const newRepos = githubProfile.repos.filter((repo: any) => !existingRepoNames.has(repo.name))

    if (newRepos.length === 0 && daysSinceUpdate < this.MAX_UPDATE_INTERVAL_DAYS) {
      console.log(`No new repos for portfolio ${portfolio.id}, waiting for max interval`)
      return
    }

    console.log(`🆕 Found ${newRepos.length} new repos for portfolio ${portfolio.id}`)

    // Send update notification to user
    await this.sendUpdateNotification(portfolio.user_id, {
      tokenId: portfolio.nft_token_id,
      newReposCount: newRepos.length,
      daysSinceUpdate,
    })

    // Store update request
    await supabase.from('portfolio_update_requests').insert({
      user_id: portfolio.user_id,
      portfolio_id: portfolio.id,
      token_id: portfolio.nft_token_id,
      reason: `Auto-update: ${newRepos.length} new repos, ${daysSinceUpdate} days since last update`,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
  }

  /**
   * Perform portfolio update (called when user approves)
   */
  async performPortfolioUpdate(
    userId: string,
    tokenId: number,
    walletAddress: string,
    onProgress?: (progress: any) => void
  ): Promise<{ txHash: string; version: number }> {
    const supabase = createClient()

    console.log(`🔄 Performing portfolio update for token ${tokenId}...`)

    // Fetch user's GitHub username and access token
    const { data: user } = await supabase.from('users').select('github_username').eq('id', userId).single()

    if (!user?.github_username) {
      throw new Error('GitHub username not found')
    }

    // Retrieve GitHub OAuth access token
    const { data: connection } = await supabase
      .from('github_connections')
      .select('access_token')
      .eq('user_id', userId)
      .single()

    // Re-sync GitHub data with access token
    console.log(`📦 Syncing GitHub data for ${user.github_username}...`)
    await portfolioGenerator.syncGitHubAndRegenerate(
      userId, 
      user.github_username,
      connection?.access_token
    )

    // Generate updated portfolio data
    const result = await portfolioGenerator.generatePortfolio(userId, walletAddress)

    // Update NFT on blockchain
    console.log(`🎨 Updating NFT #${tokenId} on Celo blockchain...`)

    const updateResult = await portfolioNFTService.updatePortfolioNFT(
      tokenId,
      result, // This contains the new portfolio data
      onProgress || (() => {})
    )

    // Update database
    await supabase
      .from('portfolios')
      .update({
        ipfs_hash: result.ipfsHash,
        blockchain_tx_hash: updateResult.txHash,
        last_sync_at: new Date().toISOString(),
        version: updateResult.version,
      })
      .eq('nft_token_id', tokenId)

    // Mark update request as completed
    await supabase
      .from('portfolio_update_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('token_id', tokenId)
      .eq('status', 'pending')

    console.log(`✅ Portfolio NFT #${tokenId} updated to version ${updateResult.version}`)

    return updateResult
  }

  /**
   * Enable auto-update for a portfolio
   */
  async enableAutoUpdate(userId: string, tokenId: number): Promise<void> {
    const supabase = createClient()

    await supabase
      .from('portfolios')
      .update({
        auto_update_enabled: true,
        auto_update_interval_days: this.MIN_UPDATE_INTERVAL_DAYS,
      })
      .eq('user_id', userId)
      .eq('nft_token_id', tokenId)

    console.log(`✅ Auto-update enabled for portfolio NFT #${tokenId}`)
  }

  /**
   * Disable auto-update for a portfolio
   */
  async disableAutoUpdate(userId: string, tokenId: number): Promise<void> {
    const supabase = createClient()

    await supabase
      .from('portfolios')
      .update({ auto_update_enabled: false })
      .eq('user_id', userId)
      .eq('nft_token_id', tokenId)

    console.log(`❌ Auto-update disabled for portfolio NFT #${tokenId}`)
  }

  /**
   * Get update schedule for a portfolio
   */
  async getUpdateSchedule(tokenId: number): Promise<UpdateSchedule | null> {
    const supabase = createClient()

    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('*, users(clerk_id)')
      .eq('nft_token_id', tokenId)
      .single()

    if (!portfolio) return null

    const lastUpdated = new Date(portfolio.last_sync_at || portfolio.created_at)
    const nextUpdateDue = new Date(lastUpdated.getTime() + this.MIN_UPDATE_INTERVAL_DAYS * 24 * 60 * 60 * 1000)

    return {
      userId: portfolio.user_id,
      tokenId,
      lastUpdated,
      nextUpdateDue,
      autoUpdateEnabled: portfolio.auto_update_enabled || false,
      walletAddress: portfolio.wallet_address || '',
    }
  }

  /**
   * Send update notification to user
   */
  private async sendUpdateNotification(
    userId: string,
    details: { tokenId: number; newReposCount: number; daysSinceUpdate: number }
  ): Promise<void> {
    const supabase = createClient()

    // Store notification in database
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'portfolio_update_available',
      title: '🔄 Portfolio Update Available',
      message: `Your portfolio NFT #${details.tokenId} is ready for an update! You have ${details.newReposCount} new repositories and it's been ${details.daysSinceUpdate} days since your last update.`,
      data: JSON.stringify(details),
      read: false,
      created_at: new Date().toISOString(),
    })

    console.log(`📧 Update notification sent to user ${userId}`)
  }

  /**
   * Get pending update requests for a user
   */
  async getPendingUpdateRequests(userId: string): Promise<any[]> {
    const supabase = createClient()

    const { data: requests } = await supabase
      .from('portfolio_update_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    return requests || []
  }

  /**
   * Check if portfolio can be updated (blockchain check)
   */
  async canUpdatePortfolio(tokenId: number): Promise<{ canUpdate: boolean; daysRemaining: number }> {
    try {
      const contract = portfolioNFTService.getContract()
      if (!contract) {
        throw new Error('Contract not initialized')
      }

      const [canUpdate, timeRemaining] = await contract.canUpdatePortfolio(tokenId)

      const daysRemaining = Math.ceil(Number(timeRemaining) / 86400)

      return { canUpdate, daysRemaining }
    } catch (error) {
      console.error('Error checking update eligibility:', error)
      return { canUpdate: false, daysRemaining: 0 }
    }
  }
}

export const portfolioAutoUpdater = new PortfolioAutoUpdater()

// Cron job setup (to be run by a scheduler like Vercel Cron or AWS Lambda)
export async function runAutoUpdateCheck() {
  console.log('🕐 Running scheduled portfolio auto-update check...')
  await portfolioAutoUpdater.checkAndUpdateDuePortfolios()
  console.log('✅ Auto-update check completed')
}
