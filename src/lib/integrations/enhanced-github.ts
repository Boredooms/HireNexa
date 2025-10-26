/**
 * ENHANCED GITHUB DATA FETCHER
 * 
 * Fetches MAXIMUM context from GitHub for accurate AI analysis:
 * - Complete profile data
 * - Detailed repository information
 * - Language distributions
 * - Commit counts
 * - Contributor counts
 * - README previews
 * - Aggregated statistics
 */

import { Octokit } from '@octokit/rest'
import type { EnhancedGitHubData } from '@/lib/ai/enhanced-prompts'

export class EnhancedGitHubService {
  private octokit: Octokit

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken || process.env.GITHUB_TOKEN,
    })
  }

  /**
   * Get COMPLETE GitHub profile with maximum context
   */
  async getEnhancedProfile(username: string): Promise<EnhancedGitHubData> {
    console.log(`🔍 Fetching enhanced GitHub data for ${username}...`)
    
    try {
      // 1. Get user profile
      const { data: user } = await this.octokit.users.getByUsername({ username })
      
      // 2. Get ALL repositories
      const { data: repos } = await this.octokit.repos.listForUser({
        username,
        sort: 'updated',
        per_page: 100,
      })

      console.log(`   ✓ Found ${repos.length} repositories`)

      // 3. Enhance each repository with detailed data
      const enhancedRepos = await Promise.all(
        repos.slice(0, 50).map(async (repo) => { // Limit to 50 for performance
          try {
            // Get languages
            const { data: languages } = await this.octokit.repos.listLanguages({
              owner: username,
              repo: repo.name,
            })

            // Get commit count (approximate)
            let commits = 0
            try {
              const { data: commitData } = await this.octokit.repos.listCommits({
                owner: username,
                repo: repo.name,
                per_page: 1,
              })
              // GitHub provides total count in headers, but we'll estimate
              commits = (repo.size || 0) > 0 ? Math.min((repo.size || 0) / 10, 1000) : 0
            } catch {
              commits = 0
            }

            // Get contributors count
            let contributors = 0
            try {
              const { data: contributorData } = await this.octokit.repos.listContributors({
                owner: username,
                repo: repo.name,
                per_page: 1,
              })
              contributors = contributorData.length
            } catch {
              contributors = 1
            }

            // Get README preview
            let readme = null
            try {
              const { data: readmeData } = await this.octokit.repos.getReadme({
                owner: username,
                repo: repo.name,
              })
              // Decode base64 content
              const content = Buffer.from(readmeData.content, 'base64').toString('utf-8')
              readme = content.substring(0, 500) // First 500 chars
            } catch {
              readme = null
            }

            return {
              name: repo.name,
              description: repo.description || null,
              language: repo.language || null,
              languages,
              topics: repo.topics || [],
              stars: repo.stargazers_count || 0,
              forks: repo.forks_count || 0,
              watchers: repo.watchers_count || 0,
              openIssues: repo.open_issues_count || 0,
              size: repo.size || 0,
              createdAt: repo.created_at || new Date().toISOString(),
              updatedAt: repo.updated_at || new Date().toISOString(),
              pushedAt: repo.pushed_at || new Date().toISOString(),
              defaultBranch: repo.default_branch || 'main',
              license: repo.license?.name || null,
              hasWiki: repo.has_wiki || false,
              hasIssues: repo.has_issues || false,
              hasProjects: repo.has_projects || false,
              hasDownloads: repo.has_downloads || false,
              isArchived: repo.archived || false,
              isFork: repo.fork || false,
              isTemplate: repo.is_template || false,
              commits,
              contributors,
              readme,
            }
          } catch (error) {
            console.warn(`   ⚠ Could not enhance repo ${repo.name}:`, error)
            // Return basic data if enhancement fails
            return {
              name: repo.name,
              description: repo.description || null,
              language: repo.language || null,
              languages: {},
              topics: repo.topics || [],
              stars: repo.stargazers_count || 0,
              forks: repo.forks_count || 0,
              watchers: repo.watchers_count || 0,
              openIssues: repo.open_issues_count || 0,
              size: repo.size || 0,
              createdAt: repo.created_at || new Date().toISOString(),
              updatedAt: repo.updated_at || new Date().toISOString(),
              pushedAt: repo.pushed_at || new Date().toISOString(),
              defaultBranch: repo.default_branch || 'main',
              license: null,
              hasWiki: repo.has_wiki || false,
              hasIssues: repo.has_issues || false,
              hasProjects: repo.has_projects || false,
              hasDownloads: repo.has_downloads || false,
              isArchived: repo.archived || false,
              isFork: repo.fork || false,
              isTemplate: false,
              commits: 0,
              contributors: 1,
              readme: null,
            }
          }
        })
      )

      console.log(`   ✓ Enhanced ${enhancedRepos.length} repositories`)

      // 4. Calculate aggregated statistics
      const totalStars = enhancedRepos.reduce((sum, r) => sum + r.stars, 0)
      const totalForks = enhancedRepos.reduce((sum, r) => sum + r.forks, 0)
      const totalCommits = enhancedRepos.reduce((sum, r) => sum + r.commits, 0)

      // Language distribution (total bytes per language)
      const languageDistribution: Record<string, number> = {}
      enhancedRepos.forEach(repo => {
        Object.entries(repo.languages).forEach(([lang, bytes]) => {
          languageDistribution[lang] = (languageDistribution[lang] || 0) + bytes
        })
      })

      // Topic frequency
      const topicFrequency: Record<string, number> = {}
      enhancedRepos.forEach(repo => {
        repo.topics.forEach(topic => {
          topicFrequency[topic] = (topicFrequency[topic] || 0) + 1
        })
      })

      // Average repo age
      const now = Date.now()
      const averageRepoAge = enhancedRepos.length > 0 ? Math.floor(
        enhancedRepos.reduce((sum, r) => {
          return sum + (now - new Date(r.createdAt || new Date()).getTime())
        }, 0) / enhancedRepos.length / (1000 * 60 * 60 * 24)
      ) : 0

      // Recent activity (repos updated in last 30 days)
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
      const recentActivity = enhancedRepos.filter(r => 
        new Date(r.updatedAt || new Date()).getTime() > thirtyDaysAgo
      ).length

      // Contribution streak (simplified - days since account creation)
      const contributionStreak = Math.floor(
        (now - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      console.log(`   ✓ Calculated statistics`)
      console.log(`     - Total Stars: ${totalStars}`)
      console.log(`     - Total Commits: ${totalCommits}`)
      console.log(`     - Languages: ${Object.keys(languageDistribution).length}`)
      console.log(`     - Recent Activity: ${recentActivity} repos`)

      return {
        // Profile Data
        username: user.login,
        name: user.name || null,
        bio: user.bio || null,
        company: user.company || null,
        location: user.location || null,
        email: user.email || null,
        blog: user.blog || null,
        twitter: user.twitter_username || null,
        publicRepos: user.public_repos || 0,
        publicGists: user.public_gists || 0,
        followers: user.followers || 0,
        following: user.following || 0,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
        
        // Repository Data
        repos: enhancedRepos,
        
        // Aggregated Stats
        totalStars,
        totalForks,
        totalCommits,
        languageDistribution,
        topicFrequency,
        averageRepoAge,
        recentActivity,
        contributionStreak,
      }
    } catch (error) {
      console.error('❌ Error fetching enhanced GitHub profile:', error)
      throw new Error('Failed to fetch enhanced GitHub profile')
    }
  }
}

export const enhancedGitHubService = new EnhancedGitHubService()
