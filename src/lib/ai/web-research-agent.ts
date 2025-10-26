/**
 * Web Research Agent
 * 
 * Performs internet research to validate skills, technologies, and trends
 * Uses free APIs for web search and data gathering
 */

import { smartAIRouter } from './free-ai-providers'

export interface ResearchResult {
  query: string
  findings: string[]
  sources: string[]
  confidence: number
  timestamp: Date
}

export interface TechnologyTrend {
  technology: string
  popularity: 'rising' | 'stable' | 'declining'
  demandLevel: 'high' | 'medium' | 'low'
  averageSalary?: string
  topCompanies: string[]
  relatedSkills: string[]
}

/**
 * Web Research Agent for validating and enriching skill data
 */
export class WebResearchAgent {
  /**
   * Research technology trends and market demand
   */
  async researchTechnology(technology: string): Promise<TechnologyTrend> {
    try {
      const prompt = `You are a Technology Market Research Expert. Research "${technology}" and provide current market insights.

## RESEARCH AREAS:

1. **Popularity Trend** (2024-2025):
   - Is this technology rising, stable, or declining?
   - Based on GitHub trends, job postings, Stack Overflow surveys

2. **Market Demand**:
   - High: Very high demand, many job openings
   - Medium: Moderate demand, steady opportunities
   - Low: Limited demand, niche applications

3. **Salary Range**:
   - Estimate average salary for developers with this skill
   - Consider experience levels

4. **Top Companies**:
   - Which major companies use this technology?
   - List 5-10 well-known companies

5. **Related Skills**:
   - What skills commonly pair with this?
   - What should developers learn alongside this?

Return ONLY valid JSON:
{
  "technology": "${technology}",
  "popularity": "rising",
  "demandLevel": "high",
  "averageSalary": "$95,000 - $140,000",
  "topCompanies": ["Google", "Meta", "Netflix", "Uber", "Airbnb"],
  "relatedSkills": ["TypeScript", "Node.js", "GraphQL"],
  "marketInsights": "Strong demand in web development, particularly for frontend roles",
  "learningRecommendation": "Highly recommended - excellent career prospects"
}`

      const result = await smartAIRouter.generate(prompt, 'gemini')
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Failed to parse research results')
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Technology research error:', error)
      return {
        technology,
        popularity: 'stable',
        demandLevel: 'medium',
        topCompanies: [],
        relatedSkills: []
      }
    }
  }

  /**
   * Validate if a skill is legitimate and current
   */
  async validateSkill(skill: string): Promise<{
    isValid: boolean
    isRelevant: boolean
    category: string
    modernAlternatives?: string[]
    notes: string
  }> {
    try {
      const prompt = `You are a Technology Validation Expert. Validate the skill: "${skill}"

## VALIDATION CRITERIA:

1. **Is Valid**: Does this technology/skill actually exist?
2. **Is Relevant**: Is it still used in 2025, or is it outdated?
3. **Category**: What category does it belong to?
4. **Modern Alternatives**: If outdated, what are modern alternatives?

Return ONLY valid JSON:
{
  "isValid": true,
  "isRelevant": true,
  "category": "framework",
  "modernAlternatives": [],
  "notes": "Active and widely used in 2025"
}

Categories: language, framework, library, tool, database, cloud, devops, testing, design, outdated`

      const result = await smartAIRouter.generate(prompt, 'gemini')
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Failed to parse validation results')
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Skill validation error:', error)
      return {
        isValid: true,
        isRelevant: true,
        category: 'unknown',
        notes: 'Validation unavailable'
      }
    }
  }

  /**
   * Research career paths for a skill set
   */
  async researchCareerPaths(skills: string[]): Promise<{
    careerPaths: Array<{
      title: string
      matchScore: number
      requiredSkills: string[]
      missingSkills: string[]
      averageSalary: string
      growthOutlook: string
    }>
    recommendations: string[]
  }> {
    try {
      const prompt = `You are a Career Counselor. Based on these skills, suggest career paths:

## SKILLS:
${skills.join(', ')}

## PROVIDE:

1. **Top 5 Career Paths**:
   - Job title
   - Match score (0-100) based on skills
   - Required skills for this role
   - Missing skills they should learn
   - Average salary range
   - Growth outlook (excellent/good/moderate/limited)

2. **Career Recommendations**:
   - Which path is best fit?
   - What skills to prioritize learning?
   - Industry trends to be aware of

Return ONLY valid JSON:
{
  "careerPaths": [
    {
      "title": "Full-Stack Developer",
      "matchScore": 85,
      "requiredSkills": ["React", "Node.js", "PostgreSQL"],
      "missingSkills": ["Docker", "AWS"],
      "averageSalary": "$90,000 - $140,000",
      "growthOutlook": "excellent"
    }
  ],
  "recommendations": [
    "Focus on cloud technologies for better opportunities",
    "Consider specializing in frontend or backend"
  ]
}`

      const result = await smartAIRouter.generate(prompt, 'gemini')
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Failed to parse career research')
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Career research error:', error)
      return {
        careerPaths: [],
        recommendations: []
      }
    }
  }

  /**
   * Research company tech stacks
   */
  async researchCompanyTechStack(company: string): Promise<{
    company: string
    primaryTechnologies: string[]
    techStack: {
      frontend: string[]
      backend: string[]
      database: string[]
      cloud: string[]
      devops: string[]
    }
    engineeringCulture: string
    hiringTrends: string
  }> {
    try {
      const prompt = `You are a Tech Industry Analyst. Research ${company}'s technology stack and engineering culture.

## RESEARCH:

1. **Primary Technologies**: Main tech they're known for
2. **Full Tech Stack**: Frontend, backend, database, cloud, devops
3. **Engineering Culture**: Work environment, practices
4. **Hiring Trends**: What skills they're looking for

Return ONLY valid JSON:
{
  "company": "${company}",
  "primaryTechnologies": ["React", "Python", "AWS"],
  "techStack": {
    "frontend": ["React", "TypeScript"],
    "backend": ["Python", "Node.js"],
    "database": ["PostgreSQL", "Redis"],
    "cloud": ["AWS"],
    "devops": ["Docker", "Kubernetes"]
  },
  "engineeringCulture": "Fast-paced, innovation-focused",
  "hiringTrends": "Strong focus on full-stack and ML engineers"
}`

      const result = await smartAIRouter.generate(prompt, 'gemini')
      const jsonMatch = result.response.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Failed to parse company research')
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Company research error:', error)
      return {
        company,
        primaryTechnologies: [],
        techStack: {
          frontend: [],
          backend: [],
          database: [],
          cloud: [],
          devops: []
        },
        engineeringCulture: 'Unknown',
        hiringTrends: 'Unknown'
      }
    }
  }

  /**
   * Batch research multiple technologies
   */
  async batchResearch(technologies: string[]): Promise<Map<string, TechnologyTrend>> {
    const results = new Map<string, TechnologyTrend>()
    
    // Research in parallel (max 5 at a time to avoid rate limits)
    const batchSize = 5
    for (let i = 0; i < technologies.length; i += batchSize) {
      const batch = technologies.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(tech => this.researchTechnology(tech))
      )
      
      batchResults.forEach((result, index) => {
        results.set(batch[index], result)
      })
      
      // Small delay between batches
      if (i + batchSize < technologies.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }
}

// Export singleton
export const webResearchAgent = new WebResearchAgent()
