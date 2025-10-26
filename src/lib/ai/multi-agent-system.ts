/**
 * Multi-Agent AI System for GitHub Analysis
 * 
 * Architecture:
 * 1. ProfileScanner Agent - Scans GitHub profile metadata
 * 2. CodebaseAnalyzer Agent - Deep code analysis
 * 3. CodeReviewer Agent - Reviews code quality
 * 4. SkillExtractor Agent - Extracts and validates skills
 * 5. AIDetector Agent - Detects AI-generated code
 * 6. Orchestrator - Coordinates all agents
 * 
 * Free AI APIs Used:
 * - Gemini 2.5 Flash (FREE, unlimited)
 * - DeepSeek API (FREE tier, 2% cost of OpenAI)
 * - Groq API (FREE tier, ultra-fast inference)
 * - Hugging Face (FREE, 15K requests/month)
 */

import { optimizedRouter } from './optimized-providers'

// Types
export interface AgentResult {
  agentName: string
  status: 'success' | 'error'
  data: any
  confidence: number
  timestamp: Date
  processingTime: number
}

export interface GitHubRepo {
  name: string
  description: string | null
  language: string | null
  topics: string[]
  stars: number
  forks: number
  size: number
  updated_at: string
  url: string
  default_branch: string
}

export interface SkillAnalysis {
  skill: string
  confidence: number
  evidence: string[]
  category: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  exampleRepos: string[]
  verified: boolean
  aiGenerated: boolean
}

export interface ComprehensiveAnalysis {
  profileScan: AgentResult
  codebaseAnalysis: AgentResult
  codeReview: AgentResult
  skillExtraction: AgentResult
  aiDetection: AgentResult
  finalReport: {
    skills: SkillAnalysis[]
    summary: string
    careerLevel: string
    strengths: string[]
    recommendations: string[]
    trustScore: number
    aiCodePercentage: number
  }
}

/**
 * Agent 1: Profile Scanner
 * Scans GitHub profile for metadata, activity patterns, and social proof
 */
export class ProfileScannerAgent {
  // Uses Cerebras for ULTRA-FAST profile scanning (world's fastest!)

  async scan(profile: {
    username: string
    name: string | null
    bio: string | null
    repos: GitHubRepo[]
    followers: number
    following: number
    publicRepos: number
  }): Promise<AgentResult> {
    const startTime = Date.now()

    try {
      const prompt = `You are a GitHub Profile Analysis Expert. Analyze this developer's profile comprehensively.

## PROFILE DATA:
Username: ${profile.username}
Name: ${profile.name}
Bio: ${profile.bio}
Repositories: ${profile.publicRepos}
Followers: ${profile.followers}
Following: ${profile.following}

## REPOSITORIES OVERVIEW:
${JSON.stringify(profile.repos.map(r => ({
  name: r.name,
  language: r.language,
  stars: r.stars,
  forks: r.forks,
  topics: r.topics,
  updated: r.updated_at
})).slice(0, 20), null, 2)}

## ANALYZE:
1. **Activity Pattern**: Consistency, recency, commit frequency
2. **Social Proof**: Followers, stars, forks - is this genuine?
3. **Repository Quality**: Meaningful projects vs tutorial repos
4. **Specialization**: What domains/technologies do they focus on?
5. **Career Stage**: Junior, Mid, Senior, Expert based on portfolio
6. **Red Flags**: Suspicious patterns, copied repos, inactive account

Return ONLY valid JSON:
{
  "activityScore": 85,
  "socialProofScore": 70,
  "qualityScore": 90,
  "specializations": ["Full-Stack Development", "Machine Learning"],
  "careerStage": "Mid-level Software Engineer",
  "redFlags": [],
  "highlights": ["Consistent contributor", "High-quality projects"],
  "trustScore": 88,
  "summary": "Active developer with strong portfolio..."
}`

      const result = await optimizedRouter.generate(prompt, 'profile-scan')
      const text = result.response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Failed to parse profile scan results')
      }

      const data = JSON.parse(jsonMatch[0])

      return {
        agentName: 'ProfileScanner',
        status: 'success',
        data,
        confidence: data.trustScore || 75,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('ProfileScanner error:', error)
      return {
        agentName: 'ProfileScanner',
        status: 'error',
        data: { error: 'Profile scan failed' },
        confidence: 0,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      }
    }
  }
}

/**
 * Agent 2: Codebase Analyzer
 * Deep analysis of code structure, patterns, and complexity
 */
export class CodebaseAnalyzerAgent {
  // Uses Cerebras for code analysis (ultra-fast inference)

  async analyze(repos: GitHubRepo[]): Promise<AgentResult> {
    const startTime = Date.now()

    try {
      // Analyze top repositories
      const topRepos = repos
        .sort((a, b) => (b.stars + b.forks) - (a.stars + a.forks))
        .slice(0, 10)

      const prompt = `You are a Senior Software Architect. Perform deep codebase analysis.

## REPOSITORIES TO ANALYZE:
${JSON.stringify(topRepos.map(r => ({
  name: r.name,
  description: r.description,
  language: r.language,
  topics: r.topics,
  stars: r.stars,
  forks: r.forks,
  size: r.size
})), null, 2)}

## DEEP ANALYSIS REQUIRED:

1. **Architecture Patterns**: What patterns are used? (MVC, Microservices, etc.)
2. **Code Complexity**: Estimate complexity based on size, language, topics
3. **Technology Stack**: Full stack analysis (frontend, backend, database, etc.)
4. **Best Practices**: Evidence of testing, documentation, CI/CD
5. **Innovation Level**: Are these standard CRUD apps or innovative solutions?
6. **Scale & Performance**: Evidence of handling scale, optimization
7. **Code Organization**: Project structure, modularity

Return ONLY valid JSON:
{
  "architecturePatterns": ["MVC", "REST API"],
  "complexityLevel": "high",
  "techStack": {
    "frontend": ["React", "TypeScript"],
    "backend": ["Node.js", "Express"],
    "database": ["PostgreSQL"],
    "devops": ["Docker", "GitHub Actions"]
  },
  "bestPractices": {
    "testing": true,
    "documentation": true,
    "cicd": true,
    "codeReview": true
  },
  "innovationScore": 75,
  "scaleReadiness": 80,
  "organizationScore": 85,
  "insights": ["Well-structured applications", "Modern tech stack"]
}`

      const result = await optimizedRouter.generate(prompt, 'code-analysis')
      const text = result.response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Failed to parse codebase analysis')
      }

      const data = JSON.parse(jsonMatch[0])

      return {
        agentName: 'CodebaseAnalyzer',
        status: 'success',
        data,
        confidence: 85,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('CodebaseAnalyzer error:', error)
      return {
        agentName: 'CodebaseAnalyzer',
        status: 'error',
        data: { error: 'Codebase analysis failed' },
        confidence: 0,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      }
    }
  }
}

/**
 * Agent 3: Code Reviewer
 * Reviews code quality, patterns, and identifies issues
 */
export class CodeReviewerAgent {
  // Uses Gemini for code review (FREE and unlimited)

  async review(repos: GitHubRepo[]): Promise<AgentResult> {
    const startTime = Date.now()

    try {
      const prompt = `You are a Principal Engineer conducting code review. Assess code quality indicators.

## REPOSITORIES:
${JSON.stringify(repos.slice(0, 15).map(r => ({
  name: r.name,
  language: r.language,
  topics: r.topics,
  stars: r.stars,
  size: r.size
})), null, 2)}

## CODE REVIEW CRITERIA:

1. **Code Quality Indicators**:
   - Repository size vs complexity
   - Use of modern frameworks
   - Topic tags indicating best practices
   - Star/fork ratio (quality signal)

2. **Maintainability**:
   - Recent updates
   - Consistent language usage
   - Clear project purposes

3. **Professional Standards**:
   - README presence (inferred from topics)
   - Testing frameworks in topics
   - CI/CD indicators
   - Documentation

4. **Code Smells** (potential issues):
   - Too many small repos (tutorial following)
   - Abandoned projects
   - Inconsistent quality
   - Lack of focus

Return ONLY valid JSON:
{
  "overallQuality": 82,
  "maintainabilityScore": 78,
  "professionalismScore": 85,
  "codeSmells": ["Some abandoned projects"],
  "strengths": ["Modern frameworks", "Good documentation"],
  "improvements": ["More testing", "Consistent updates"],
  "qualityTrend": "improving",
  "recommendedForHiring": true
}`

      const result = await optimizedRouter.generate(prompt, 'code-analysis')
      const text = result.response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Failed to parse code review')
      }

      const data = JSON.parse(jsonMatch[0])

      return {
        agentName: 'CodeReviewer',
        status: 'success',
        data,
        confidence: 80,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('CodeReviewer error:', error)
      return {
        agentName: 'CodeReviewer',
        status: 'error',
        data: { error: 'Code review failed' },
        confidence: 0,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      }
    }
  }
}

/**
 * Agent 4: Skill Extractor
 * Extracts and validates skills with high accuracy
 */
export class SkillExtractorAgent {
  // Uses Gemini for skill extraction (good at structured data)

  async extract(repos: GitHubRepo[], profileData: any, codebaseData: any): Promise<AgentResult> {
    const startTime = Date.now()

    try {
      const prompt = `You are an Expert Technical Recruiter. Extract ALL skills with MAXIMUM ACCURACY.

## REPOSITORIES (${repos.length} total):
${JSON.stringify(repos.map(r => ({
  name: r.name,
  description: r.description,
  language: r.language,
  topics: r.topics,
  stars: r.stars,
  forks: r.forks
})), null, 2)}

## PROFILE ANALYSIS:
${JSON.stringify(profileData, null, 2)}

## CODEBASE ANALYSIS:
${JSON.stringify(codebaseData, null, 2)}

## SKILL EXTRACTION RULES:

1. **Primary Skills** (Languages):
   - Count frequency across repos
   - Weight by repo size and stars
   - Confidence = (frequency × quality) / total_repos × 100

2. **Framework Skills**:
   - Extract from topics and descriptions
   - Validate against language compatibility
   - Check for proper usage patterns

3. **Tool Skills**:
   - DevOps tools (Docker, K8s, CI/CD)
   - Databases (SQL, NoSQL)
   - Cloud platforms (AWS, GCP, Azure)

4. **Skill Level Assessment**:
   - beginner: 1-2 repos, basic usage
   - intermediate: 3-5 repos, good practices
   - advanced: 6-10 repos, complex implementations
   - expert: 10+ repos, significant impact, high stars

5. **Evidence Requirements**:
   - Specific repository names
   - Concrete usage examples
   - Impact metrics (stars, forks)

Return ONLY valid JSON array (15-30 skills):
[
  {
    "skill": "React",
    "confidence": 92,
    "evidence": [
      "Used in 8 repositories with complex state management",
      "Custom hooks in 'portfolio-app' (45 stars)",
      "Advanced patterns in 'ecommerce-platform'"
    ],
    "category": "framework",
    "level": "advanced",
    "exampleRepos": ["portfolio-app", "ecommerce-platform", "task-manager"],
    "verified": true,
    "yearsOfExperience": 3
  }
]

Categories: language, framework, tool, database, cloud, devops, testing, design
Be thorough and accurate. Extract 20-30 skills minimum.`

      const result = await optimizedRouter.generate(prompt, 'skill-extraction')
      const text = result.response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      
      if (!jsonMatch) {
        throw new Error('Failed to parse skill extraction')
      }

      const skills = JSON.parse(jsonMatch[0])

      return {
        agentName: 'SkillExtractor',
        status: 'success',
        data: { skills, totalSkills: skills.length },
        confidence: 90,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('SkillExtractor error:', error)
      return {
        agentName: 'SkillExtractor',
        status: 'error',
        data: { error: 'Skill extraction failed', skills: [] },
        confidence: 0,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      }
    }
  }
}

/**
 * Agent 5: AI Code Detector
 * Detects AI-generated code patterns
 */
export class AIDetectorAgent {
  // Uses OpenRouter for AI detection (diverse model access)

  async detect(repos: GitHubRepo[]): Promise<AgentResult> {
    const startTime = Date.now()

    try {
      const prompt = `You are an AI Code Detection Specialist. Analyze repositories for AI-generated code patterns.

## REPOSITORIES:
${JSON.stringify(repos.slice(0, 20).map(r => ({
  name: r.name,
  description: r.description,
  language: r.language,
  topics: r.topics,
  size: r.size,
  updated: r.updated_at
})), null, 2)}

## AI-GENERATED CODE INDICATORS:

1. **Suspicious Patterns**:
   - Generic variable names (data, result, response)
   - Overly verbose comments
   - Perfect formatting but shallow logic
   - Tutorial-like structure
   - Lack of personal coding style

2. **Repository Patterns**:
   - Many repos created in short time
   - Similar structure across projects
   - Generic descriptions
   - Lack of commit history depth

3. **Authenticity Signals** (GOOD):
   - Unique problem-solving approaches
   - Personal coding style
   - Incremental development
   - Real-world problem solving
   - Meaningful commit messages

4. **Risk Assessment**:
   - Low risk: Genuine developer work
   - Medium risk: Some AI assistance (acceptable)
   - High risk: Mostly AI-generated (concerning)

Return ONLY valid JSON:
{
  "aiGeneratedPercentage": 15,
  "riskLevel": "low",
  "suspiciousRepos": [],
  "authenticRepos": ["project-a", "project-b"],
  "aiAssistedRepos": ["project-c"],
  "indicators": {
    "genericPatterns": false,
    "rapidCreation": false,
    "uniqueStyle": true,
    "realWorldProblems": true
  },
  "trustScore": 92,
  "recommendation": "Genuine developer with minimal AI assistance"
}`

      const result = await optimizedRouter.generate(prompt, 'ai-detection')
      const text = result.response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Failed to parse AI detection')
      }

      const data = JSON.parse(jsonMatch[0])

      return {
        agentName: 'AIDetector',
        status: 'success',
        data,
        confidence: 85,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('AIDetector error:', error)
      return {
        agentName: 'AIDetector',
        status: 'error',
        data: { error: 'AI detection failed', aiGeneratedPercentage: 0 },
        confidence: 0,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      }
    }
  }
}

/**
 * Orchestrator: Coordinates all agents
 */
export class MultiAgentOrchestrator {
  private profileScanner = new ProfileScannerAgent()
  private codebaseAnalyzer = new CodebaseAnalyzerAgent()
  private codeReviewer = new CodeReviewerAgent()
  private skillExtractor = new SkillExtractorAgent()
  private aiDetector = new AIDetectorAgent()
  // Uses Gemini for final report generation

  /**
   * Run complete multi-agent analysis
   */
  async analyzeGitHub(profile: {
    username: string
    name: string | null
    bio: string | null
    repos: GitHubRepo[]
    followers: number
    following: number
    publicRepos: number
  }): Promise<ComprehensiveAnalysis> {
    console.log('🤖 Starting Multi-Agent Analysis...')

    // Run agents in parallel for speed
    const [profileScan, codebaseAnalysis, codeReview, aiDetection] = await Promise.all([
      this.profileScanner.scan(profile),
      this.codebaseAnalyzer.analyze(profile.repos),
      this.codeReviewer.review(profile.repos),
      this.aiDetector.detect(profile.repos)
    ])

    console.log('✅ Phase 1 Complete: Profile, Codebase, Review, AI Detection')

    // Run skill extraction with context from other agents
    const skillExtraction = await this.skillExtractor.extract(
      profile.repos,
      profileScan.data,
      codebaseAnalysis.data
    )

    console.log('✅ Phase 2 Complete: Skill Extraction')

    // Generate final comprehensive report
    const finalReport = await this.generateFinalReport({
      profileScan,
      codebaseAnalysis,
      codeReview,
      skillExtraction,
      aiDetection,
      profile
    })

    console.log('✅ Analysis Complete!')

    return {
      profileScan,
      codebaseAnalysis,
      codeReview,
      skillExtraction,
      aiDetection,
      finalReport
    }
  }

  /**
   * Generate final comprehensive report
   */
  private async generateFinalReport(data: any): Promise<any> {
    try {
      const prompt = `You are a Senior Technical Recruiter. Create a COMPREHENSIVE FINAL REPORT.

## ALL AGENT RESULTS:

### Profile Scan:
${JSON.stringify(data.profileScan.data, null, 2)}

### Codebase Analysis:
${JSON.stringify(data.codebaseAnalysis.data, null, 2)}

### Code Review:
${JSON.stringify(data.codeReview.data, null, 2)}

### Skill Extraction:
${JSON.stringify(data.skillExtraction.data, null, 2)}

### AI Detection:
${JSON.stringify(data.aiDetection.data, null, 2)}

## CREATE FINAL REPORT:

1. **Professional Summary** (4-5 sentences):
   - Synthesize all agent findings
   - Highlight key strengths
   - Mention career level
   - Note any concerns

2. **Career Level**: Based on all analysis

3. **Top 5 Strengths**: Key technical strengths

4. **Top 5 Recommendations**: Skills to learn next

5. **Trust Score** (0-100): Overall trustworthiness

6. **AI Code Percentage**: From AI detector

Return ONLY valid JSON:
{
  "summary": "Comprehensive 4-5 sentence professional summary...",
  "careerLevel": "Senior Software Engineer",
  "strengths": [
    "Expert in full-stack development",
    "Strong system design skills"
  ],
  "recommendations": [
    "Learn Kubernetes for container orchestration",
    "Explore GraphQL for API development"
  ],
  "trustScore": 88,
  "aiCodePercentage": 15,
  "hiringRecommendation": "Strongly recommended for senior positions"
}`

      const result = await optimizedRouter.generate(prompt, 'general')
      const text = result.response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Failed to generate final report')
      }

      const finalReport = JSON.parse(jsonMatch[0])

      return {
        skills: data.skillExtraction.data.skills || [],
        summary: finalReport.summary,
        careerLevel: finalReport.careerLevel,
        strengths: finalReport.strengths,
        recommendations: finalReport.recommendations,
        trustScore: finalReport.trustScore,
        aiCodePercentage: finalReport.aiCodePercentage
      }
    } catch (error) {
      console.error('Error generating final report:', error)
      return {
        skills: data.skillExtraction.data.skills || [],
        summary: 'Analysis completed with some limitations.',
        careerLevel: 'Developer',
        strengths: [],
        recommendations: [],
        trustScore: 70,
        aiCodePercentage: 0
      }
    }
  }
}

// Export singleton instance
export const multiAgentOrchestrator = new MultiAgentOrchestrator()
