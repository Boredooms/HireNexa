/**
 * ENHANCED AI PROMPTS - MAXIMUM CONTEXT FOR ACCURATE RESULTS
 * 
 * These prompts are fine-tuned to extract maximum value from GitHub data
 * and provide the most accurate analysis possible.
 */

export interface EnhancedGitHubData {
  // Profile Data
  username: string
  name: string | null
  bio: string | null
  company: string | null
  location: string | null
  email: string | null
  blog: string | null
  twitter: string | null
  publicRepos: number
  publicGists: number
  followers: number
  following: number
  createdAt: string
  updatedAt: string
  
  // Repository Data (Enhanced)
  repos: Array<{
    name: string
    description: string | null
    language: string | null
    languages: Record<string, number> // All languages with bytes
    topics: string[]
    stars: number
    forks: number
    watchers: number
    openIssues: number
    size: number // KB
    createdAt: string
    updatedAt: string
    pushedAt: string
    defaultBranch: string
    license: string | null
    hasWiki: boolean
    hasIssues: boolean
    hasProjects: boolean
    hasDownloads: boolean
    isArchived: boolean
    isFork: boolean
    isTemplate: boolean
    commits: number
    contributors: number
    readme: string | null // First 500 chars
  }>
  
  // Aggregated Stats
  totalStars: number
  totalForks: number
  totalCommits: number
  languageDistribution: Record<string, number>
  topicFrequency: Record<string, number>
  averageRepoAge: number // days
  recentActivity: number // repos updated in last 30 days
  contributionStreak: number // days
}

/**
 * PROFILE INTELLIGENCE PROMPT
 * Optimized for deep profile analysis with maximum context
 */
export function getProfileIntelligencePrompt(data: EnhancedGitHubData): string {
  return `You are a Senior Technical Recruiter and GitHub Profile Analysis Expert with 15+ years of experience.

# DEVELOPER PROFILE ANALYSIS

## BASIC INFORMATION
- **Username**: ${data.username}
- **Name**: ${data.name || 'Not provided'}
- **Bio**: ${data.bio || 'No bio'}
- **Company**: ${data.company || 'Not specified'}
- **Location**: ${data.location || 'Not specified'}
- **Blog/Website**: ${data.blog || 'None'}
- **Account Age**: ${Math.floor((Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
- **Last Updated**: ${new Date(data.updatedAt).toLocaleDateString()}

## ACTIVITY METRICS
- **Public Repositories**: ${data.publicRepos}
- **Public Gists**: ${data.publicGists}
- **Followers**: ${data.followers}
- **Following**: ${data.following}
- **Total Stars Received**: ${data.totalStars}
- **Total Forks**: ${data.totalForks}
- **Total Commits**: ${data.totalCommits}
- **Recent Activity**: ${data.recentActivity} repos updated in last 30 days
- **Average Repo Age**: ${data.averageRepoAge} days

## LANGUAGE DISTRIBUTION (by bytes of code)
${Object.entries(data.languageDistribution)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([lang, bytes]) => `- ${lang}: ${(bytes / 1024).toFixed(2)} KB`)
  .join('\n')}

## TOP TOPICS/TECHNOLOGIES
${Object.entries(data.topicFrequency)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 15)
  .map(([topic, count]) => `- ${topic} (${count} repos)`)
  .join('\n')}

## TOP 10 REPOSITORIES (by stars + forks)
${data.repos
  .sort((a, b) => (b.stars + b.forks) - (a.stars + a.forks))
  .slice(0, 10)
  .map((r, i) => `
${i + 1}. **${r.name}** (⭐ ${r.stars}, 🍴 ${r.forks})
   - Language: ${r.language || 'Not specified'}
   - Description: ${r.description || 'No description'}
   - Topics: ${r.topics.join(', ') || 'None'}
   - Size: ${(r.size / 1024).toFixed(2)} MB
   - Age: ${Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
   - Last Updated: ${Math.floor((Date.now() - new Date(r.updatedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
   - Commits: ${r.commits}
   - Contributors: ${r.contributors}
   - Is Fork: ${r.isFork ? 'Yes' : 'No'}
   - Is Archived: ${r.isArchived ? 'Yes' : 'No'}
`).join('\n')}

# YOUR ANALYSIS TASK

Analyze this developer's profile with EXTREME DEPTH and provide:

1. **Trust Score (0-100)**: Based on:
   - Account age and consistency
   - Genuine contributions vs forked repos
   - Star/follower ratio (detect fake engagement)
   - Commit frequency and patterns
   - Repository quality and maintenance
   - Community engagement (issues, PRs, discussions)

2. **Career Stage**: Determine if Junior/Mid-level/Senior/Expert/Lead based on:
   - Complexity of projects
   - Technology stack breadth and depth
   - Code organization and best practices
   - Project impact (stars, forks, usage)
   - Years of visible activity
   - Leadership indicators (popular repos, contributions)

3. **Specializations**: Identify 3-5 specific areas of expertise:
   - Not just "Full-Stack" - be specific (e.g., "React + Node.js E-commerce")
   - Look at language distribution, topics, and project types
   - Consider depth (multiple projects) vs breadth (one-off experiments)

4. **Red Flags**: Identify any concerning patterns:
   - Mostly forked repos with no original work
   - Inactive account (no recent updates)
   - Suspicious star/follower patterns
   - Tutorial/learning repos only
   - Copied/plagiarized projects
   - Abandoned projects (many archived repos)

5. **Key Insights**: 5-7 specific observations:
   - Unique strengths or standout projects
   - Technology preferences and trends
   - Contribution patterns
   - Growth trajectory
   - Community impact

6. **Questions for Other Agents**: Generate 3-5 specific questions for:
   - CodeAnalyzer: About code quality, architecture, patterns
   - SkillExtractor: About specific skills to verify

7. **Confidence Level (0-100)**: How confident are you in this analysis?

# RETURN FORMAT (VALID JSON ONLY)

{
  "trustScore": 88,
  "careerStage": "Senior Full-Stack Engineer",
  "specializations": [
    "React + TypeScript Enterprise Applications",
    "Node.js Microservices Architecture",
    "AWS Cloud Infrastructure"
  ],
  "redFlags": [
    "Some older repos are archived and unmaintained"
  ],
  "insights": [
    "Consistent contributor with 200+ commits in last 6 months",
    "Strong focus on modern web technologies (React, Next.js, TypeScript)",
    "Active maintainer of 3 popular open-source libraries",
    "Good documentation practices across all projects",
    "Increasing complexity in recent projects shows growth"
  ],
  "questionsForCodeAnalyzer": [
    "What architectural patterns are used in the top 5 repositories?",
    "Is there evidence of testing, CI/CD, and best practices?",
    "How is error handling and logging implemented?"
  ],
  "questionsForSkillExtractor": [
    "Verify proficiency in React, TypeScript, and Node.js",
    "Check for DevOps skills (Docker, Kubernetes, CI/CD)",
    "Identify any database expertise (SQL, NoSQL)"
  ],
  "confidence": 92
}

**IMPORTANT**: 
- Be SPECIFIC and DETAILED in your analysis
- Use ACTUAL DATA from the profile (numbers, dates, repo names)
- Don't make generic statements - back everything with evidence
- Consider the FULL CONTEXT, not just surface metrics
- Return ONLY valid JSON, no markdown or extra text`
}

/**
 * CODE INTELLIGENCE PROMPT
 * Optimized for deep code analysis with repository context
 */
export function getCodeIntelligencePrompt(
  data: EnhancedGitHubData,
  profileInsights: any
): string {
  return `You are a Principal Software Architect with 20+ years of experience in code review and system design.

# CODE ANALYSIS TASK

## PROFILE CONTEXT
${JSON.stringify(profileInsights, null, 2)}

## REPOSITORIES TO ANALYZE (Top 15 by impact)
${data.repos
  .sort((a, b) => (b.stars + b.forks + b.commits) - (a.stars + a.forks + a.commits))
  .slice(0, 15)
  .map((r, i) => `
${i + 1}. **${r.name}**
   - Primary Language: ${r.language || 'Multiple'}
   - All Languages: ${Object.keys(r.languages).join(', ') || 'Unknown'}
   - Topics: ${r.topics.join(', ') || 'None'}
   - Stars: ${r.stars}, Forks: ${r.forks}, Commits: ${r.commits}
   - Contributors: ${r.contributors}
   - Size: ${(r.size / 1024).toFixed(2)} MB
   - Created: ${new Date(r.createdAt).toLocaleDateString()}
   - Last Updated: ${new Date(r.updatedAt).toLocaleDateString()}
   - Has Issues: ${r.hasIssues}, Has Wiki: ${r.hasWiki}
   - Is Fork: ${r.isFork}, Is Archived: ${r.isArchived}
   - License: ${r.license || 'None'}
   - README Preview: ${r.readme ? r.readme.substring(0, 200) + '...' : 'No README'}
`).join('\n')}

## LANGUAGE BREAKDOWN
${Object.entries(data.languageDistribution)
  .sort(([, a], [, b]) => b - a)
  .map(([lang, bytes]) => `- ${lang}: ${((bytes / Object.values(data.languageDistribution).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%`)
  .join('\n')}

# YOUR ANALYSIS TASK

Perform DEEP code analysis and provide:

1. **Architecture Patterns** (identify specific patterns used):
   - Microservices, Monolith, Serverless, JAMstack, etc.
   - Design patterns (MVC, MVVM, Repository, Factory, etc.)
   - Code organization strategies
   - Scalability approaches

2. **Technology Stack Assessment**:
   - Frontend frameworks and libraries
   - Backend frameworks and languages
   - Databases and data storage
   - Cloud services and infrastructure
   - DevOps tools and practices

3. **Code Quality Indicators**:
   - Project structure and organization
   - Testing practices (unit, integration, e2e)
   - Documentation quality
   - CI/CD implementation
   - Error handling and logging
   - Security practices

4. **Best Practices Adherence**:
   - Clean code principles
   - SOLID principles
   - DRY, KISS, YAGNI
   - Code comments and documentation
   - Git commit practices
   - Dependency management

5. **Innovation Score (0-100)**:
   - Use of modern technologies
   - Creative problem-solving
   - Unique implementations
   - Contribution to ecosystem

6. **Scale Readiness (0-100)**:
   - Can these projects handle production load?
   - Proper error handling and monitoring
   - Performance optimization
   - Security considerations

7. **Insights for SkillExtractor**:
   - Specific technologies to verify
   - Skill levels to assign
   - Evidence from code

# RETURN FORMAT (VALID JSON ONLY)

{
  "architecturePatterns": [
    "Microservices with API Gateway pattern",
    "Event-driven architecture using message queues",
    "Serverless functions for background jobs"
  ],
  "technologies": {
    "frontend": ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    "backend": ["Node.js", "Express", "NestJS", "GraphQL"],
    "database": ["PostgreSQL", "MongoDB", "Redis"],
    "cloud": ["AWS", "Vercel", "Docker"],
    "devops": ["GitHub Actions", "Jest", "ESLint"]
  },
  "codeQuality": 85,
  "bestPractices": {
    "testing": true,
    "documentation": true,
    "cicd": true,
    "codeReview": true,
    "errorHandling": true
  },
  "innovationScore": 78,
  "scaleReadiness": 82,
  "organizationScore": 88,
  "insights": [
    "Consistent use of TypeScript across all projects shows type safety focus",
    "Well-structured monorepo setup with proper dependency management",
    "Comprehensive testing with 80%+ coverage in main projects",
    "Modern CI/CD pipelines with automated deployments"
  ],
  "insightsForSkillExtractor": [
    "React expertise confirmed - uses advanced patterns (hooks, context, custom hooks)",
    "Strong TypeScript skills - complex type definitions and generics",
    "DevOps proficiency - Docker, CI/CD, infrastructure as code",
    "Database design skills - proper indexing, migrations, relationships"
  ],
  "answersToProfileAgent": [
    "Architecture: Primarily microservices with event-driven patterns",
    "Best practices: Strong evidence of testing, CI/CD, and code review",
    "Error handling: Comprehensive with custom error classes and logging"
  ],
  "confidence": 90
}

**IMPORTANT**:
- Analyze ACTUAL code patterns, not just languages
- Look for EVIDENCE of skills (testing files, config files, etc.)
- Be SPECIFIC about technologies and versions when possible
- Consider PROJECT COMPLEXITY and IMPACT
- Return ONLY valid JSON`
}

/**
 * SKILL EXTRACTION PROMPT
 * Optimized for accurate skill identification with evidence
 */
export function getSkillExtractionPrompt(
  data: EnhancedGitHubData,
  profileInsights: any,
  codeInsights: any
): string {
  return `You are a Technical Skills Assessment Expert specializing in developer evaluation.

# SKILL EXTRACTION TASK

## PROFILE INSIGHTS
${JSON.stringify(profileInsights, null, 2)}

## CODE ANALYSIS INSIGHTS
${JSON.stringify(codeInsights, null, 2)}

## REPOSITORY EVIDENCE
${data.repos.slice(0, 20).map(r => `
- **${r.name}**: ${r.language} | Topics: ${r.topics.join(', ')} | ${r.stars}⭐ ${r.commits} commits
  Languages: ${Object.keys(r.languages).join(', ')}
`).join('\n')}

## LANGUAGE DISTRIBUTION
${Object.entries(data.languageDistribution)
  .sort(([, a], [, b]) => b - a)
  .map(([lang, bytes]) => `- ${lang}: ${(bytes / 1024).toFixed(2)} KB (${((bytes / Object.values(data.languageDistribution).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)`)
  .join('\n')}

# YOUR TASK

Extract 25-30 VERIFIED skills with MAXIMUM ACCURACY:

1. **Cross-Validate** with:
   - ProfileAgent insights
   - CodeAgent analysis
   - Actual repository data
   - Language distribution
   - Topics and technologies

2. **Skill Categories**:
   - Programming Languages
   - Frameworks & Libraries
   - Databases & Storage
   - Cloud & Infrastructure
   - DevOps & Tools
   - Testing & Quality
   - Design & Architecture

3. **Skill Levels** (be accurate):
   - **Beginner**: 1-2 projects, basic usage
   - **Intermediate**: 3-5 projects, good practices
   - **Advanced**: 6-10 projects, complex implementations
   - **Expert**: 10+ projects, contributions, teaching others

4. **Confidence Scoring**:
   - 90-100%: Strong evidence across multiple projects
   - 75-89%: Good evidence in several projects
   - 60-74%: Some evidence, needs verification
   - Below 60%: Weak evidence, don't include

5. **Evidence Requirements**:
   - List 2-3 specific repositories
   - Mention actual usage patterns
   - Reference code insights

# RETURN FORMAT (JSON ARRAY)

[
  {
    "skill": "React",
    "confidence": 95,
    "evidence": [
      "Used extensively in 8 repositories",
      "Advanced patterns: custom hooks, context API, performance optimization",
      "Main projects: portfolio-app (250⭐), ecommerce-platform (180⭐)"
    ],
    "category": "framework",
    "level": "advanced",
    "exampleRepos": ["portfolio-app", "ecommerce-platform", "task-manager"],
    "yearsOfExperience": 3,
    "crossValidated": true,
    "verifiedBy": ["ProfileAgent", "CodeAgent", "LanguageData"]
  },
  {
    "skill": "TypeScript",
    "confidence": 92,
    "evidence": [
      "Primary language in 12 repositories (45% of codebase)",
      "Complex type definitions and generics usage",
      "Strict mode enabled in all projects"
    ],
    "category": "language",
    "level": "advanced",
    "exampleRepos": ["api-server", "frontend-app", "cli-tool"],
    "yearsOfExperience": 2,
    "crossValidated": true,
    "verifiedBy": ["LanguageData", "CodeAgent"]
  }
]

**IMPORTANT**:
- Extract 25-30 skills MINIMUM
- ONLY include skills with 60%+ confidence
- Use ACTUAL repository names in exampleRepos
- Cross-validate with ALL available data
- Be SPECIFIC about skill levels
- Return ONLY valid JSON array`
}

export const enhancedPrompts = {
  getProfileIntelligencePrompt,
  getCodeIntelligencePrompt,
  getSkillExtractionPrompt
}
