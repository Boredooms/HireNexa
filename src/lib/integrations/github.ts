import { Octokit } from '@octokit/rest'

export interface GitHubRepo {
  id: number
  name: string
  description: string | null
  language: string | null
  topics: string[]
  stars: number
  forks: number
  url: string
  commits?: number
}

export interface GitHubProfile {
  username: string
  name: string | null
  bio: string | null
  avatarUrl: string
  publicRepos: number
  followers: number
  following: number
  repos: GitHubRepo[]
}

export class GitHubService {
  private octokit: Octokit

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken || process.env.GITHUB_TOKEN,
    })
  }

  // Get user profile and repositories
  async getUserProfile(username: string): Promise<GitHubProfile> {
    try {
      // Get user info
      const { data: user } = await this.octokit.users.getByUsername({
        username,
      })

      // Get repositories
      const { data: repos } = await this.octokit.repos.listForUser({
        username,
        sort: 'updated',
        per_page: 100,
      })

      // Transform repos
      const transformedRepos: GitHubRepo[] = repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        language: repo.language || null,
        topics: repo.topics || [],
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        url: repo.html_url,
      }))

      return {
        username: user.login,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        repos: transformedRepos,
      }
    } catch (error) {
      console.error('Error fetching GitHub profile:', error)
      throw new Error('Failed to fetch GitHub profile')
    }
  }

  // Get repository languages
  async getRepoLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const { data } = await this.octokit.repos.listLanguages({
        owner,
        repo,
      })
      return data
    } catch (error) {
      console.error('Error fetching repo languages:', error)
      return {}
    }
  }

  // Get commit count for a repository
  async getCommitCount(owner: string, repo: string): Promise<number> {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: 1,
      })
      
      // GitHub returns total count in headers
      return data.length
    } catch (error) {
      console.error('Error fetching commit count:', error)
      return 0
    }
  }

  // Sync user's GitHub data to database
  async syncUserData(userId: string, username: string) {
    try {
      const profile = await this.getUserProfile(username)
      
      // This will be implemented with Supabase integration
      return {
        success: true,
        profile,
      }
    } catch (error) {
      console.error('Error syncing GitHub data:', error)
      throw error
    }
  }
}

export const githubService = new GitHubService()
