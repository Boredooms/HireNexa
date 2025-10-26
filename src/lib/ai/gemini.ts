import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI - FREE and UNLIMITED!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface SkillAnalysis {
  skill: string
  confidence: number // 0-100
  evidence: string[]
  category: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  exampleRepos?: string[] // Repository names that demonstrate this skill
}

export interface GitHubAnalysis {
  skills: SkillAnalysis[]
  totalRepositories: number
  totalCommits: number
  languages: Record<string, number>
  frameworks: string[]
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  /**
   * Analyze GitHub repositories and extract skills
   */
  async analyzeGitHub(repos: any[]): Promise<GitHubAnalysis> {
    try {
      const languages: Record<string, number> = {}
      const topics = new Set<string>()

      // Aggregate data
      repos.forEach(repo => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1
        }
        if (repo.topics) {
          repo.topics.forEach((topic: string) => topics.add(topic))
        }
      })

      const prompt = `You are an expert technical recruiter analyzing a developer's GitHub portfolio. Provide a comprehensive, impressive analysis.

## REPOSITORIES (${repos.length} total):
${JSON.stringify(repos.map(r => ({
  name: r.name,
  description: r.description,
  language: r.language,
  topics: r.topics || [],
  stars: r.stars || 0,
  forks: r.forks || 0,
  size: r.size || 0,
  updated: r.updated_at,
})), null, 2)}

## ANALYSIS REQUIRED:

1. **Extract ALL skills** (languages, frameworks, tools, databases, cloud platforms)
2. **Rate confidence** (0-100) based on:
   - Frequency of use across projects
   - Project complexity and quality
   - Stars/forks indicating impact
   - Recent activity showing current expertise

3. **Identify skill level** for each:
   - beginner: Basic usage, simple projects
   - intermediate: Multiple projects, good practices
   - advanced: Complex implementations, high quality
   - expert: Exceptional work, significant impact

4. **Provide specific evidence** from actual repositories

5. **Highlight standout projects** that demonstrate expertise

Return ONLY a JSON array with this EXACT format:
[
  {
    "skill": "React",
    "confidence": 92,
    "evidence": [
      "Used in 8 repositories with complex state management",
      "Custom hooks and advanced patterns in 'project-name'",
      "High-quality component architecture"
    ],
    "category": "framework",
    "level": "advanced",
    "exampleRepos": ["portfolio-website", "task-manager", "ecommerce-app"]
  }
]

IMPORTANT:
- Include "exampleRepos" array with 2-3 repository names that best demonstrate each skill
- Use EXACT repository names from the data provided
- Choose repos that clearly show proficiency in that skill

Categories: language, framework, tool, database, cloud, devops
Be thorough and impressive. Extract 15-25 skills minimum.`

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const skills = JSON.parse(jsonMatch[0]) as SkillAnalysis[]
        
        return {
          skills,
          totalRepositories: repos.length,
          totalCommits: repos.reduce((sum, r) => sum + (r.commits || 0), 0),
          languages,
          frameworks: Array.from(topics),
        }
      }

      // Fallback
      return this.fallbackSkillExtraction(repos, languages, topics)
    } catch (error) {
      console.error('Error with Gemini AI:', error)
      // Fallback to basic extraction
      const languages: Record<string, number> = {}
      const topics = new Set<string>()
      repos.forEach(repo => {
        if (repo.language) languages[repo.language] = (languages[repo.language] || 0) + 1
        if (repo.topics) repo.topics.forEach((t: string) => topics.add(t))
      })
      return this.fallbackSkillExtraction(repos, languages, topics)
    }
  }

  /**
   * Analyze code quality and provide recommendations
   */
  async analyzeCodeQuality(code: string, language: string): Promise<{
    complexity: string
    quality: number
    suggestions: string[]
  }> {
    try {
      const prompt = `Analyze this ${language} code and provide:
1. Complexity level (low/medium/high)
2. Code quality score (0-100)
3. Top 3 improvement suggestions

Code:
\`\`\`${language}
${code.slice(0, 2000)}
\`\`\`

Return ONLY a JSON object:
{
  "complexity": "medium",
  "quality": 75,
  "suggestions": ["Add error handling", "Improve naming", "Add comments"]
}`

      const result = await this.model.generateContent(prompt)
      const text = result.response.text()
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return {
        complexity: 'medium',
        quality: 75,
        suggestions: ['Add more comments', 'Improve error handling', 'Add unit tests'],
      }
    } catch (error) {
      console.error('Error analyzing code quality:', error)
      return {
        complexity: 'medium',
        quality: 70,
        suggestions: ['Code analysis unavailable'],
      }
    }
  }

  /**
   * Generate skill recommendations
   */
  async recommendSkills(currentSkills: string[]): Promise<string[]> {
    try {
      const prompt = `Based on these current skills: ${currentSkills.join(', ')}

Recommend 5 complementary skills that would:
1. Enhance career prospects
2. Fill knowledge gaps
3. Follow current industry trends

Return ONLY a JSON array of skill names:
["skill1", "skill2", "skill3", "skill4", "skill5"]`

      const result = await this.model.generateContent(prompt)
      const text = result.response.text()
      
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as string[]
      }

      return []
    } catch (error) {
      console.error('Error generating recommendations:', error)
      return []
    }
  }

  /**
   * Generate comprehensive professional summary with best projects and recommendations
   */
  async generateProfessionalSummary(profile: {
    repos: any[]
    skills: SkillAnalysis[]
    name: string
    bio: string
  }): Promise<{
    summary: string
    bestProjects: Array<{
      name: string
      why: string
      impact: string
      technologies: string[]
    }>
    recommendations: Array<{
      skill: string
      reason: string
      priority: 'high' | 'medium' | 'low'
    }>
    careerLevel: string
    strengths: string[]
  }> {
    try {
      const prompt = `You are a senior technical recruiter. Analyze this developer's portfolio and create an IMPRESSIVE, DETAILED summary.

## DEVELOPER INFO:
Name: ${profile.name}
Bio: ${profile.bio}
Repositories: ${profile.repos.length}

## TOP REPOSITORIES:
${JSON.stringify(profile.repos.slice(0, 10).map(r => ({
  name: r.name,
  description: r.description,
  language: r.language,
  stars: r.stars || 0,
  forks: r.forks || 0,
  topics: r.topics || [],
})), null, 2)}

## CURRENT SKILLS:
${profile.skills.map(s => `- ${s.skill} (${s.level}, ${s.confidence}% confidence)`).join('\n')}

## PROVIDE:

1. **Professional Summary** (3-4 sentences)
   - Highlight unique strengths
   - Mention impressive achievements
   - Sound professional and compelling

2. **Top 3 Best Projects** with:
   - Why it's impressive
   - Technical impact
   - Technologies used

3. **5 Skill Recommendations** to learn next:
   - Based on current skills
   - Industry trends
   - Career growth
   - Priority level (high/medium/low)

4. **Career Level Assessment**:
   - Junior, Mid-level, Senior, or Expert

5. **Key Strengths** (5 bullet points)

Return ONLY valid JSON:
{
  "summary": "Impressive 3-4 sentence summary...",
  "bestProjects": [
    {
      "name": "project-name",
      "why": "Why this project stands out...",
      "impact": "Technical impact and achievements...",
      "technologies": ["React", "Node.js"]
    }
  ],
  "recommendations": [
    {
      "skill": "Kubernetes",
      "reason": "Why learn this next...",
      "priority": "high"
    }
  ],
  "careerLevel": "Mid-level Software Engineer",
  "strengths": [
    "Strong full-stack development skills",
    "Excellent problem-solving abilities"
  ]
}`

      const result = await this.model.generateContent(prompt)
      const text = result.response.text()
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // Fallback
      return {
        summary: `${profile.name} is a skilled developer with ${profile.repos.length} repositories, demonstrating expertise in ${profile.skills.slice(0, 3).map(s => s.skill).join(', ')}.`,
        bestProjects: profile.repos.slice(0, 3).map(r => ({
          name: r.name,
          why: 'Demonstrates technical proficiency',
          impact: 'Contributes to the developer ecosystem',
          technologies: [r.language],
        })),
        recommendations: [
          { skill: 'Docker', reason: 'Essential for modern development', priority: 'high' as const },
          { skill: 'TypeScript', reason: 'Industry standard for type safety', priority: 'high' as const },
        ],
        careerLevel: 'Mid-level Developer',
        strengths: [
          'Strong technical foundation',
          'Active open-source contributor',
          'Continuous learner',
        ],
      }
    } catch (error) {
      console.error('Error generating professional summary:', error)
      return {
        summary: `${profile.name} is a developer with ${profile.repos.length} repositories.`,
        bestProjects: [],
        recommendations: [],
        careerLevel: 'Developer',
        strengths: [],
      }
    }
  }

  /**
   * Fallback skill extraction (no AI)
   */
  private fallbackSkillExtraction(
    repos: any[],
    languages: Record<string, number>,
    topics: Set<string>
  ): GitHubAnalysis {
    const skills: SkillAnalysis[] = []

    // Add languages
    Object.entries(languages).forEach(([lang, count]) => {
      skills.push({
        skill: lang,
        confidence: Math.min(100, count * 15),
        evidence: [`Used in ${count} repositories`],
        category: 'language',
        level: count > 5 ? 'advanced' : count > 2 ? 'intermediate' : 'beginner',
      })
    })

    // Add frameworks/tools from topics
    Array.from(topics).slice(0, 10).forEach(topic => {
      skills.push({
        skill: topic,
        confidence: 60,
        evidence: ['Listed in repository topics'],
        category: 'framework',
        level: 'intermediate',
      })
    })

    return {
      skills,
      totalRepositories: repos.length,
      totalCommits: 0,
      languages,
      frameworks: Array.from(topics),
    }
  }
}

export const geminiService = new GeminiService()
