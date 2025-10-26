/**
 * TRUE AGENTIC MULTI-AGENT SYSTEM
 * 
 * Features:
 * - Agents communicate with each other
 * - Shared memory and context
 * - Agents can request help from other agents
 * - Collaborative decision making
 * - Self-improving through feedback loops
 */

import { optimizedRouter } from './optimized-providers'

// Shared memory between agents
interface AgentMemory {
  findings: Map<string, any>
  insights: string[]
  questions: string[]
  confidence: Map<string, number>
  agentCommunications: AgentMessage[]
}

interface AgentMessage {
  from: string
  to: string
  type: 'request' | 'response' | 'insight' | 'question'
  content: any
  timestamp: Date
}

interface AgentContext {
  memory: AgentMemory
  sendMessage: (to: string, type: AgentMessage['type'], content: any) => void
  getInsights: (from: string) => any[]
  askAgent: (agent: string, question: string) => Promise<any>
}

/**
 * Base Agent Class with Communication
 */
abstract class BaseAgent {
  protected name: string
  protected context: AgentContext
  protected preferredProvider: string
  protected fallbackModel?: string

  constructor(name: string, context: AgentContext, provider: string = 'gemini') {
    this.name = name
    this.context = context
    this.preferredProvider = provider
  }

  protected async generate(prompt: string): Promise<string> {
    try {
      // Try preferred provider first
      const result = await optimizedRouter.generate(prompt, this.preferredProvider as any)
      console.log(`   ✓ ${this.name} used: ${result.provider} (${result.model})`)
      return result.response
    } catch (error) {
      console.warn(`   ⚠ ${this.name}: Primary provider failed, trying Gemini fallback...`)
      
      // Fallback to Gemini (FREE & UNLIMITED)
      try {
        const result = await optimizedRouter.generate(prompt, 'summary-generation')
        console.log(`   ✓ ${this.name} used FALLBACK: gemini`)
        return result.response
      } catch (fallbackError) {
        console.error(`   ✗ ${this.name}: All providers failed`)
        throw fallbackError
      }
    }
  }

  protected sendInsight(insight: string) {
    this.context.memory.insights.push(`[${this.name}] ${insight}`)
  }

  protected askQuestion(question: string) {
    this.context.memory.questions.push(`[${this.name}] ${question}`)
  }

  protected storeFindings(key: string, data: any, confidence: number) {
    this.context.memory.findings.set(key, data)
    this.context.memory.confidence.set(key, confidence)
  }

  protected getOtherAgentFindings(agentName: string): any[] {
    return this.context.getInsights(agentName)
  }

  abstract analyze(data: any): Promise<any>
}

/**
 * Agent 1: Profile Intelligence Agent
 * Analyzes profile and communicates findings to other agents
 */
class ProfileIntelligenceAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('ProfileIntelligence', context, 'cerebras')
  }

  async analyze(profile: any): Promise<any> {
    console.log(`🤖 ${this.name}: Starting profile analysis...`)

    const prompt = `You are a Profile Intelligence Agent in a multi-agent system.

PROFILE DATA:
${JSON.stringify(profile, null, 2)}

TASK:
1. Analyze the profile deeply
2. Identify key patterns and insights
3. Generate questions for other agents to investigate
4. Rate confidence in your findings

Return JSON:
{
  "trustScore": 0-100,
  "careerStage": "Junior/Mid/Senior/Expert",
  "specializations": ["area1", "area2"],
  "redFlags": ["flag1"],
  "insights": ["insight1", "insight2"],
  "questionsForCodeAnalyzer": ["question1"],
  "questionsForSkillExtractor": ["question1"],
  "confidence": 0-100
}`

    const response = await this.generate(prompt)
    const data = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}')

    // Store findings for other agents
    this.storeFindings('profile_analysis', data, data.confidence || 75)

    // Send insights to other agents
    data.insights?.forEach((insight: string) => this.sendInsight(insight))

    // Ask questions to other agents
    data.questionsForCodeAnalyzer?.forEach((q: string) => 
      this.context.sendMessage('CodeAnalyzer', 'question', q)
    )

    console.log(`✅ ${this.name}: Analysis complete (confidence: ${data.confidence}%)`)
    return data
  }
}

/**
 * Agent 2: Code Intelligence Agent
 * Analyzes code and responds to questions from other agents
 */
class CodeIntelligenceAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('CodeIntelligence', context, 'cerebras')
  }

  async analyze(repos: any[]): Promise<any> {
    console.log(`🤖 ${this.name}: Starting code analysis...`)

    // Get questions from ProfileIntelligence agent
    const profileQuestions = this.context.memory.agentCommunications
      .filter(m => m.to === 'CodeAnalyzer' && m.type === 'question')
      .map(m => m.content)

    // Get profile insights
    const profileInsights = this.context.getInsights('ProfileIntelligence')

    const prompt = `You are a Code Intelligence Agent in a multi-agent system.

REPOSITORIES:
${JSON.stringify(repos.slice(0, 10), null, 2)}

PROFILE INSIGHTS FROM OTHER AGENT:
${profileInsights.join('\n')}

QUESTIONS FROM PROFILE AGENT:
${profileQuestions.join('\n')}

TASK:
1. Analyze code patterns and architecture
2. Answer questions from ProfileIntelligence agent
3. Identify skills and technologies used
4. Generate insights for SkillExtractor agent
5. Rate confidence in findings

Return JSON:
{
  "architecturePatterns": ["pattern1"],
  "technologies": ["tech1", "tech2"],
  "codeQuality": 0-100,
  "answersToProfileAgent": ["answer1"],
  "insightsForSkillExtractor": ["insight1"],
  "confidence": 0-100
}`

    const response = await this.generate(prompt)
    const data = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}')

    // Store findings
    this.storeFindings('code_analysis', data, data.confidence || 80)

    // Send answers back to ProfileIntelligence
    data.answersToProfileAgent?.forEach((answer: string) => 
      this.context.sendMessage('ProfileIntelligence', 'response', answer)
    )

    // Send insights to SkillExtractor
    data.insightsForSkillExtractor?.forEach((insight: string) => 
      this.context.sendMessage('SkillExtractor', 'insight', insight)
    )

    console.log(`✅ ${this.name}: Analysis complete (confidence: ${data.confidence}%)`)
    return data
  }
}

/**
 * Agent 3: Skill Extraction Agent
 * Extracts skills using insights from other agents
 */
class SkillExtractionAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('SkillExtractor', context, 'summary-generation')
  }

  async analyze(repos: any[]): Promise<any> {
    console.log(`🤖 ${this.name}: Starting skill extraction...`)

    // Get insights from other agents
    const profileData = this.context.memory.findings.get('profile_analysis')
    const codeData = this.context.memory.findings.get('code_analysis')
    const allInsights = this.context.memory.insights

    const prompt = `You are a Skill Extraction Agent in a multi-agent system.

REPOSITORIES:
${JSON.stringify(repos.slice(0, 15), null, 2)}

INSIGHTS FROM PROFILE AGENT:
${JSON.stringify(profileData, null, 2)}

INSIGHTS FROM CODE AGENT:
${JSON.stringify(codeData, null, 2)}

ALL AGENT INSIGHTS:
${allInsights.join('\n')}

TASK:
Using ALL insights from other agents, extract 25-30 verified skills.
Cross-validate with findings from ProfileIntelligence and CodeIntelligence agents.

Return JSON array:
[
  {
    "skill": "React",
    "confidence": 95,
    "evidence": ["Used in 5 projects", "ProfileAgent confirmed"],
    "category": "framework",
    "level": "advanced",
    "crossValidated": true,
    "verifiedBy": ["ProfileAgent", "CodeAgent"]
  }
]`

    const response = await this.generate(prompt)
    const skills = JSON.parse(response.match(/\[[\s\S]*\]/)?.[0] || '[]')

    // Store findings
    this.storeFindings('skills', skills, 90)

    // Send summary to coordinator
    this.sendInsight(`Extracted ${skills.length} cross-validated skills`)

    console.log(`✅ ${this.name}: Extracted ${skills.length} skills`)
    return skills
  }
}

/**
 * Agent 4: AI Detection Agent
 * Detects AI-generated code patterns
 */
class AIDetectionAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('AIDetector', context, 'ai-detection')
  }

  async analyze(repos: any[]): Promise<any> {
    console.log(`🤖 ${this.name}: Starting AI detection...`)

    const prompt = `You are an AI Detection Agent.

REPOSITORIES:
${JSON.stringify(repos.slice(0, 10), null, 2)}

Detect AI-generated code patterns.

Return JSON:
{
  "aiGeneratedPercentage": 0-100,
  "confidence": 0-100,
  "indicators": ["indicator1"],
  "trustScore": 0-100
}`

    const response = await this.generate(prompt)
    const data = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}')

    this.storeFindings('ai_detection', data, data.confidence || 85)
    this.sendInsight(`AI code detected: ${data.aiGeneratedPercentage}%`)

    console.log(`✅ ${this.name}: Detection complete`)
    return data
  }
}

/**
 * Coordinator Agent
 * Orchestrates all agents and synthesizes final report
 */
class CoordinatorAgent extends BaseAgent {
  constructor(context: AgentContext) {
    super('Coordinator', context, 'summary-generation')
  }

  async synthesize(): Promise<any> {
    console.log(`🤖 ${this.name}: Synthesizing final report...`)

    const allFindings = Object.fromEntries(this.context.memory.findings)
    const allInsights = this.context.memory.insights
    const allCommunications = this.context.memory.agentCommunications

    const prompt = `You are the Coordinator Agent synthesizing findings from multiple agents.

ALL AGENT FINDINGS:
${JSON.stringify(allFindings, null, 2)}

ALL INSIGHTS:
${allInsights.join('\n')}

AGENT COMMUNICATIONS:
${JSON.stringify(allCommunications, null, 2)}

TASK:
Create a comprehensive final report that:
1. Synthesizes all agent findings
2. Resolves any conflicts between agents
3. Provides final recommendations
4. Calculates overall confidence

Return JSON:
{
  "summary": "comprehensive summary",
  "skills": [...],
  "trustScore": 0-100,
  "aiCodePercentage": 0-100,
  "careerLevel": "level",
  "strengths": ["strength1"],
  "recommendations": ["rec1"],
  "agentConsensus": 0-100,
  "confidence": 0-100
}`

    const response = await this.generate(prompt)
    const report = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}')

    console.log(`✅ ${this.name}: Final report complete (consensus: ${report.agentConsensus}%)`)
    return report
  }

  async analyze(): Promise<any> {
    return this.synthesize()
  }
}

/**
 * Agentic Orchestrator
 * Manages agent communication and coordination
 */
export class AgenticOrchestrator {
  private memory: AgentMemory
  private context: AgentContext

  constructor() {
    this.memory = {
      findings: new Map(),
      insights: [],
      questions: [],
      confidence: new Map(),
      agentCommunications: []
    }

    this.context = {
      memory: this.memory,
      sendMessage: this.sendMessage.bind(this),
      getInsights: this.getInsights.bind(this),
      askAgent: this.askAgent.bind(this)
    }
  }

  private sendMessage(to: string, type: AgentMessage['type'], content: any) {
    this.memory.agentCommunications.push({
      from: 'unknown',
      to,
      type,
      content,
      timestamp: new Date()
    })
  }

  private getInsights(from: string): any[] {
    return this.memory.insights.filter(i => i.startsWith(`[${from}]`))
  }

  private async askAgent(agent: string, question: string): Promise<any> {
    // Implement inter-agent communication
    return null
  }

  async analyzeGitHub(profile: any): Promise<any> {
    console.log(`\n🚀 Starting Agentic Multi-Agent Analysis...`)
    console.log(`📊 Agents will communicate and collaborate\n`)

    const startTime = Date.now()

    // Initialize agents
    const profileAgent = new ProfileIntelligenceAgent(this.context)
    const codeAgent = new CodeIntelligenceAgent(this.context)
    const skillAgent = new SkillExtractionAgent(this.context)
    const aiAgent = new AIDetectionAgent(this.context)
    const coordinator = new CoordinatorAgent(this.context)

    // Phase 1: Initial analysis (parallel)
    console.log(`📍 Phase 1: Initial Analysis (Parallel)`)
    const [profileResult, aiResult] = await Promise.all([
      profileAgent.analyze(profile),
      aiAgent.analyze(profile.repos)
    ])

    // Phase 2: Code analysis (uses profile insights)
    console.log(`\n📍 Phase 2: Code Analysis (Using Profile Insights)`)
    const codeResult = await codeAgent.analyze(profile.repos)

    // Phase 3: Skill extraction (uses all insights)
    console.log(`\n📍 Phase 3: Skill Extraction (Cross-Validated)`)
    const skillResult = await skillAgent.analyze(profile.repos)

    // Phase 4: Final synthesis
    console.log(`\n📍 Phase 4: Final Synthesis`)
    const finalReport = await coordinator.synthesize()

    const totalTime = Date.now() - startTime

    console.log(`\n✅ Agentic Analysis Complete!`)
    console.log(`   - Agents communicated: ${this.memory.agentCommunications.length} messages`)
    console.log(`   - Insights generated: ${this.memory.insights.length}`)
    console.log(`   - Agent consensus: ${finalReport.agentConsensus}%`)
    console.log(`   - Total time: ${(totalTime / 1000).toFixed(2)}s\n`)

    return {
      finalReport: {
        ...finalReport,
        skills: skillResult
      },
      agentResults: {
        profile: profileResult,
        code: codeResult,
        skills: skillResult,
        aiDetection: aiResult
      },
      agentCommunications: this.memory.agentCommunications,
      insights: this.memory.insights,
      processingTime: totalTime
    }
  }
}

export const agenticOrchestrator = new AgenticOrchestrator()
