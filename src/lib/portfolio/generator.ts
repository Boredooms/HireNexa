import { createClient } from '@/lib/supabase/server'
import { ipfsService, type PortfolioData } from '@/lib/ipfs/pinata'
import { githubService } from '@/lib/integrations/github'
import { geminiService } from '@/lib/ai/gemini'
import { celoService } from '@/lib/celo/service'

export class PortfolioGenerator {
  // Generate complete portfolio from user data
  async generatePortfolio(userId: string, walletAddress?: string): Promise<{
    ipfsHash: string
    nftMetadataHash: string | null
    requiresMinting: boolean
    nftMinted: boolean
  }> {
    const supabase = createClient()

    // Fetch user profile from users table (userId is Clerk ID)
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      throw new Error('Profile not found')
    }

    // users.id IS the Clerk ID (simplified schema)
    const dbUserId = userId

    // Fetch skills from skills table
    const { data: skills } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', dbUserId)
      .eq('revoked', false)
      .order('confidence_score', { ascending: false })

    // Fetch projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false})

    // Fetch credentials
    const { data: credentials } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', dbUserId)
      .eq('revoked', false)

    // Get Gemini-recommended best projects (max 2-3 for space efficiency)
    const featuredProjects = (projects || [])
      .filter(p => p.is_featured)
      .slice(0, 3)
      .map(project => ({
        name: project.name,
        why: project.ai_analysis || 'Demonstrates technical proficiency',
        impact: project.impact_statement || 'Contributes to the developer ecosystem',
        technologies: project.technologies || [],
      }))

    // Build portfolio data
    const portfolioData: PortfolioData = {
      userId,
      fullName: profile.full_name || 'Anonymous',
      title: this.generateTitle(skills || []),
      bio: profile.bio || '',
      avatarUrl: profile.avatar_url,
      githubUsername: profile.github_username,
      careerLevel: profile.career_level,
      skills: (skills || []).map(skill => ({
        name: skill.skill_name,
        confidence: skill.confidence_score,
        evidence: skill.evidence_ipfs ? [skill.evidence_ipfs] : [],
      })),
      projects: (projects || []).map(project => ({
        name: project.name,
        description: project.description || '',
        url: project.url || '',
        technologies: project.technologies || [],
      })),
      bestProjects: featuredProjects,
      experience: [], // Will be populated from LinkedIn
      education: [], // Will be populated from LinkedIn
      certifications: (credentials || []).map(cred => ({
        name: cred.credential_type,
        issuer: 'HireNexa',
        date: new Date(cred.issued_at).toISOString(),
        credentialUrl: cred.metadata_ipfs
          ? ipfsService.getGatewayUrl(cred.metadata_ipfs)
          : undefined,
      })),
      generatedAt: new Date().toISOString(),
    }

    // Upload encrypted portfolio to IPFS
    const encryptedIpfsHash = await ipfsService.uploadPortfolio(portfolioData)

    let nftMetadataHash: string | null = null

    // Prepare NFT metadata for client-side minting (user pays gas)
    if (walletAddress) {
      try {
        // Upload public NFT metadata (for display on explorers)
        console.log(`📋 Creating NFT metadata...`)
        nftMetadataHash = await ipfsService.uploadNFTMetadata(portfolioData, encryptedIpfsHash)
        console.log(`✅ NFT metadata ready: ipfs://${nftMetadataHash}`)
        console.log(`💡 User will mint NFT via MetaMask (user pays gas)`)
      } catch (error) {
        console.error('Failed to create NFT metadata:', error)
        // Continue even if metadata creation fails
      }
    }

    // Save portfolio record (without NFT info yet - will be updated after client-side mint)
    await supabase.from('portfolios').insert({
      user_id: userId,
      ipfs_hash: encryptedIpfsHash,
      title: portfolioData.title,
      description: portfolioData.bio,
      visibility: 'public',
      last_sync_at: new Date().toISOString(),
    })

    return {
      ipfsHash: encryptedIpfsHash,
      nftMetadataHash: nftMetadataHash ? `ipfs://${nftMetadataHash}` : null,
      requiresMinting: !!walletAddress && !!nftMetadataHash,
      nftMinted: false, // Will be minted client-side
    }
  }

  // Generate professional title from skills
  private generateTitle(skills: any[]): string {
    if (skills.length === 0) return 'Developer'

    const topSkills = skills
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 3)
      .map(s => s.skill_name)

    if (topSkills.includes('React') || topSkills.includes('JavaScript')) {
      return 'Full-Stack Developer'
    } else if (topSkills.includes('Python')) {
      return 'Python Developer'
    } else if (topSkills.includes('Java')) {
      return 'Java Developer'
    } else {
      return `${topSkills[0]} Developer`
    }
  }

  // Sync GitHub and regenerate portfolio
  async syncGitHubAndRegenerate(userId: string, githubUsername: string, accessToken?: string): Promise<{
    ipfsHash: string
    nftMetadataHash: string | null
    requiresMinting: boolean
    nftMinted: boolean
  }> {
    const supabase = createClient()

    console.log(`🔄 Syncing GitHub for user ${userId}: ${githubUsername}`)

    // Create GitHubService instance with user's OAuth token
    const GitHubService = (await import('@/lib/integrations/github')).GitHubService
    const userGitHubService = new GitHubService(accessToken)

    // Fetch GitHub data using authenticated service
    const githubProfile = await userGitHubService.getUserProfile(githubUsername)
    console.log(`📦 Found ${githubProfile.repos.length} repositories`)

    // Create or update user profile in Supabase
    console.log(`👤 Creating/updating user profile...`)
    const { error: upsertError } = await supabase.from('users').upsert({
      id: userId,
      clerk_id: userId,
      email: `${githubUsername}@github.user`,
      full_name: githubProfile.name || githubUsername,
      bio: githubProfile.bio || `Developer with ${githubProfile.publicRepos} public repositories`,
      github_username: githubUsername,
      avatar_url: githubProfile.avatarUrl,
    }, { onConflict: 'id' })

    if (upsertError) {
      console.warn('Warning: Could not update user profile:', upsertError)
    }

    // Analyze skills with Gemini AI
    console.log(`🤖 Analyzing code with Gemini AI...`)
    const analysis = await geminiService.analyzeGitHub(githubProfile.repos)
    console.log(`✅ Gemini extracted ${analysis.skills.length} skills`)

    // Generate professional summary with Gemini
    console.log(`📝 Generating professional summary...`)
    const professionalSummary = await geminiService.generateProfessionalSummary({
      repos: githubProfile.repos,
      skills: analysis.skills,
      name: githubProfile.name || githubUsername,
      bio: githubProfile.bio || '',
    })
    console.log(`✅ Professional analysis complete`)

    // Store professional summary
    console.log(`💾 Storing professional analysis...`)
    await supabase.from('users').update({
      professional_summary: professionalSummary.summary,
      career_level: professionalSummary.careerLevel,
      key_strengths: professionalSummary.strengths,
    }).eq('id', userId)

    // DELETE old skills first (fresh start on every sync)
    console.log(`🧹 Deleting old skills for fresh sync...`)
    console.log(`   User ID for deletion: ${userId}`)
    
    const { error: deleteSkillsError, count } = await supabase
      .from('skills')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
    
    if (deleteSkillsError) {
      console.error('❌ Error deleting old skills:', deleteSkillsError)
    } else {
      console.log(`✅ Deleted ${count || 0} old skills`)
    }
    
    // Store skills with example repos (normalize skill names to prevent duplicates)
    console.log(`💾 Storing ${analysis.skills.length} skills in Supabase...`)
    
    // Normalize skill names to prevent duplicates
    const normalizeSkillName = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[\/\(\)\-]/g, ' ') // Remove special chars
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Title case
        .join(' ')
    }
    
    const skillMap = new Map<string, typeof analysis.skills[0]>()
    
    // Deduplicate skills by normalized name (keep highest confidence)
    for (const skill of analysis.skills) {
      const normalizedName = normalizeSkillName(skill.skill)
      const existing = skillMap.get(normalizedName)
      
      if (!existing || skill.confidence > existing.confidence) {
        skillMap.set(normalizedName, { ...skill, skill: normalizedName })
      }
    }
    
    console.log(`📊 Deduplicated: ${analysis.skills.length} → ${skillMap.size} unique skills`)
    
    // Insert fresh skills (not upsert, since we deleted old ones)
    for (const skill of skillMap.values()) {
      const { error: skillError } = await supabase.from('skills').insert({
        user_id: userId,
        skill_name: skill.skill,
        confidence_score: skill.confidence,
        category: skill.category,
        level: skill.level,
        source: 'github',
        evidence: skill.evidence,
        example_repos: skill.exampleRepos || [],
        verified_at: new Date().toISOString(),
      })
      
      if (skillError) {
        console.error(`❌ Error storing skill ${skill.skill}:`, skillError)
      }
    }
    console.log(`✅ Skills stored successfully`)

    // Store best projects metadata
    for (const bestProject of professionalSummary.bestProjects) {
      const repo = githubProfile.repos.find(r => r.name === bestProject.name)
      if (repo) {
        await supabase.from('projects').update({
          is_featured: true,
          ai_analysis: bestProject.why,
          impact_statement: bestProject.impact,
        }).eq('user_id', userId).eq('name', repo.name)
      }
    }

    // Store skill recommendations
    for (const rec of professionalSummary.recommendations) {
      await supabase.from('skill_recommendations').upsert({
        user_id: userId,
        skill_name: rec.skill,
        reason: rec.reason,
        priority: rec.priority,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,skill_name' })
    }

    // DELETE old projects first (fresh start on every sync)
    console.log(`🧹 Deleting old projects for fresh sync...`)
    const { error: deleteProjectsError } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', userId)
    
    if (deleteProjectsError) {
      console.error('Error deleting old projects:', deleteProjectsError)
    }
    
    // Store projects
    console.log(`📁 Storing ${githubProfile.repos.length} projects in Supabase (showing first 10)...`)
    for (const repo of githubProfile.repos.slice(0, 10)) {
      const { error: projectError } = await supabase.from('projects').insert({
        user_id: userId,
        name: repo.name,
        description: repo.description,
        url: repo.url,
        github_url: repo.url,
        technologies: repo.topics,
        stars: repo.stars,
        forks: repo.forks,
      })
      
      if (projectError) {
        console.error(`❌ Error storing project ${repo.name}:`, projectError)
      }
    }
    console.log(`✅ Projects stored successfully`)

    // Update sync status
    console.log(`📊 Updating sync status...`)
    await supabase.from('sync_status').upsert({
      user_id: userId,
      source: 'github',
      last_sync_at: new Date().toISOString(),
      status: 'success',
    }, { onConflict: 'user_id,source' })

    console.log(`✨ GitHub sync complete! Generating portfolio...`)
    
    // Check if user has a wallet address stored (userId is Clerk ID)
    const { data: userProfile, error: walletFetchError } = await supabase
      .from('users')
      .select('id, wallet_address')
      .eq('id', userId)
      .single()

    if (walletFetchError) {
      console.error('Error fetching user profile:', walletFetchError)
    }

    const walletAddress = userProfile?.wallet_address
    const dbUserId = userProfile?.id

    console.log(`👤 User profile: clerk_id=${userId}, db_id=${dbUserId}, wallet=${walletAddress || 'NOT SET'}`)

    // Check if user already has a portfolio NFT
    const { data: existingPortfolio } = await supabase
      .from('portfolios')
      .select('nft_token_id')
      .eq('user_id', userId)
      .not('nft_token_id', 'is', null)
      .single()

    if (existingPortfolio?.nft_token_id) {
      // Check if this is a fake token ID (old system generated random IDs)
      // Fake IDs are typically large random numbers > 100000
      const isFakeTokenId = existingPortfolio.nft_token_id > 100000
      
      if (isFakeTokenId && walletAddress) {
        // Re-mint with real blockchain transaction
        console.log(`🔄 Detected fake NFT #${existingPortfolio.nft_token_id} - minting real NFT...`)
        
        // Delete old fake portfolio record
        await supabase
          .from('portfolios')
          .delete()
          .eq('user_id', userId)
        
        // Prepare for real NFT minting
        const result = await this.generatePortfolio(userId, walletAddress)
        console.log(`✅ Portfolio ready for NFT minting!`)
        if (result.requiresMinting) {
          console.log(`💡 User needs to mint NFT via MetaMask with metadata: ${result.nftMetadataHash}`)
        }
        return result
      } else {
        // User already has real NFT - just update the data
        console.log(`📝 User already has portfolio NFT #${existingPortfolio.nft_token_id}`)
        const result = await this.generatePortfolio(userId)
        return result
      }
    } else if (walletAddress) {
      // First time - prepare for NFT minting
      console.log(`🎨 First portfolio generation - preparing NFT for ${walletAddress}`)
      const result = await this.generatePortfolio(userId, walletAddress)
      if (result.requiresMinting) {
        console.log(`💡 User needs to mint NFT via MetaMask`)
        console.log(`📋 NFT Metadata: ${result.nftMetadataHash}`)
      }
      return result
    } else {
      // No wallet - just generate portfolio without NFT
      console.log(`⚠️ No wallet address found - generating portfolio without NFT`)
      const result = await this.generatePortfolio(userId)
      return result
    }
  }

  // Sync GitHub with Multi-Agent System (NEW - More accurate and consistent)
  async syncGitHubWithMultiAgent(
    userId: string,
    githubUsername: string,
    multiAgentOrchestrator: any,
    webResearchAgent: any,
    accessToken?: string
  ): Promise<{
    ipfsHash: string
    nftMetadataHash: string | null
    requiresMinting: boolean
    nftMinted: boolean
    trustScore: number
    aiCodePercentage: number
    skillsCount: number
    careerLevel: string
    agentResults: any
  }> {
    const supabase = createClient()

    console.log(`🤖 Starting Multi-Agent Analysis for ${githubUsername}...`)

    // Create GitHubService instance with user's OAuth token
    const GitHubService = (await import('@/lib/integrations/github')).GitHubService
    const userGitHubService = new GitHubService(accessToken)

    // Fetch GitHub data using authenticated service
    const githubProfile = await userGitHubService.getUserProfile(githubUsername)
    console.log(`📦 Found ${githubProfile.repos.length} repositories`)

    // Run Multi-Agent Analysis
    console.log(`🔬 Running comprehensive multi-agent analysis...`)
    const analysis = await multiAgentOrchestrator.analyzeGitHub({
      username: githubProfile.username,
      name: githubProfile.name,
      bio: githubProfile.bio,
      repos: githubProfile.repos,
      followers: githubProfile.followers,
      following: githubProfile.following,
      publicRepos: githubProfile.publicRepos
    })

    console.log(`✅ Multi-Agent Analysis Complete!`)
    console.log(`   - Profile Trust Score: ${analysis.profileScan.data.trustScore}`)
    console.log(`   - Code Quality: ${analysis.codeReview.data.overallQuality}`)
    console.log(`   - AI Code: ${analysis.aiDetection.data.aiGeneratedPercentage}%`)
    console.log(`   - Skills Extracted: ${analysis.skillExtraction.data.skills.length}`)

    // Create or update user profile
    console.log(`👤 Updating user profile with analysis...`)
    await supabase.from('users').upsert({
      id: userId,
      email: `${githubUsername}@github.user`,
      full_name: githubProfile.name || githubUsername,
      bio: githubProfile.bio || `Developer with ${githubProfile.publicRepos} public repositories`,
      github_username: githubUsername,
      avatar_url: githubProfile.avatarUrl,
      professional_summary: analysis.finalReport.summary,
      career_level: analysis.finalReport.careerLevel,
      key_strengths: analysis.finalReport.strengths,
    }, { onConflict: 'id' })

    // users.id IS the Clerk ID (simplified schema)
    console.log(`📝 User ID: ${userId}`)

    // Delete old skills for fresh sync
    console.log(`🧹 Clearing old skills...`)
    await supabase.from('skills').delete().eq('user_id', userId)

    // Store skills from multi-agent analysis
    console.log(`💾 Storing ${analysis.finalReport.skills.length} verified skills...`)
    for (const skill of analysis.finalReport.skills) {
      await supabase.from('skills').insert({
        user_id: userId,
        skill_name: skill.skill,
        confidence_score: skill.confidence,
        category: skill.category,
        level: skill.level,
        source: 'multi-agent-ai',
        evidence: skill.evidence,
        example_repos: skill.exampleRepos || [],
        verified_at: new Date().toISOString(),
        ai_verified: skill.verified,
        ai_generated_code: skill.aiGenerated || false,
      })
    }

    // Store skill recommendations
    for (const rec of analysis.finalReport.recommendations) {
      await supabase.from('skill_recommendations').upsert({
        user_id: userId,
        skill_name: rec,
        reason: 'Recommended by multi-agent analysis',
        priority: 'medium',
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,skill_name' })
    }

    // Delete old projects
    console.log(`🧹 Clearing old projects...`)
    await supabase.from('projects').delete().eq('user_id', userId)

    // Store projects
    console.log(`📁 Storing ${githubProfile.repos.length} projects...`)
    for (const repo of githubProfile.repos.slice(0, 20)) {
      await supabase.from('projects').insert({
        user_id: userId,
        name: repo.name,
        description: repo.description,
        url: repo.url,
        github_url: repo.url,
        technologies: repo.topics,
        stars: repo.stars,
        forks: repo.forks,
      })
    }

    // Update sync status
    await supabase.from('sync_status').upsert({
      user_id: userId,
      source: 'github',
      last_sync_at: new Date().toISOString(),
      status: 'success',
      metadata: {
        trustScore: analysis.finalReport.trustScore,
        aiCodePercentage: analysis.finalReport.aiCodePercentage,
        analysisMethod: 'multi-agent'
      }
    }, { onConflict: 'user_id,source' })

    console.log(`✨ Multi-Agent Analysis complete! Generating portfolio...`)

    // Get wallet address
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, wallet_address')
      .eq('id', userId)
      .single()

    const walletAddress = userProfile?.wallet_address

    // Generate portfolio
    const portfolioResult = await this.generatePortfolio(userId, walletAddress)

    return {
      ...portfolioResult,
      trustScore: analysis.finalReport.trustScore,
      aiCodePercentage: analysis.finalReport.aiCodePercentage,
      skillsCount: analysis.finalReport.skills.length,
      careerLevel: analysis.finalReport.careerLevel,
      agentResults: {
        profileScan: analysis.profileScan.data,
        codebaseAnalysis: analysis.codebaseAnalysis.data,
        codeReview: analysis.codeReview.data,
        aiDetection: analysis.aiDetection.data
      }
    }
  }

  // Get portfolio by IPFS hash
  async getPortfolio(ipfsHash: string): Promise<PortfolioData> {
    return await ipfsService.fetchFromIPFS(ipfsHash)
  }
}

export const portfolioGenerator = new PortfolioGenerator()
