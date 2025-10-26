/**
 * Free AI API Providers Configuration
 * 
 * Multiple FREE AI APIs for redundancy and load balancing:
 * 1. Gemini 2.5 Flash - FREE, unlimited (Primary)
 * 2. DeepSeek API - FREE tier, 2% cost of OpenAI
 * 3. Groq API - FREE tier, ultra-fast inference
 * 4. Hugging Face - FREE, 15K requests/month
 * 5. Together AI - FREE tier available
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// API Configuration
const API_KEYS = {
  gemini: process.env.GEMINI_API_KEY || '',
  deepseek: process.env.DEEPSEEK_API_KEY || '',
  groq: process.env.GROQ_API_KEY || '',
  huggingface: process.env.HUGGINGFACE_API_KEY || '',
  openrouter: process.env.OPENROUTER_API_KEY || '',
  cerebras: process.env.CEREBRAS_API_KEY || ''
}

export interface AIProvider {
  name: string
  available: boolean
  priority: number
  rateLimit: number
  cost: 'free' | 'paid'
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'cerebras',
    available: !!API_KEYS.cerebras,
    priority: 1, // HIGHEST - World's fastest!
    rateLimit: 14400, // 900/hour, 14.4K/day
    cost: 'free'
  },
  {
    name: 'gemini',
    available: !!API_KEYS.gemini,
    priority: 2,
    rateLimit: 999999, // Unlimited
    cost: 'free'
  },
  {
    name: 'groq',
    available: !!API_KEYS.groq,
    priority: 3,
    rateLimit: 14400, // Per day
    cost: 'free'
  },
  {
    name: 'deepseek',
    available: !!API_KEYS.deepseek,
    priority: 4,
    rateLimit: 10000, // Per day
    cost: 'free'
  },
  {
    name: 'huggingface',
    available: !!API_KEYS.huggingface,
    priority: 5,
    rateLimit: 15000, // Per month
    cost: 'free'
  },
  {
    name: 'openrouter',
    available: !!API_KEYS.openrouter,
    priority: 6,
    rateLimit: 999999, // Pay-as-you-go, cost-optimized
    cost: 'paid'
  }
]

/**
 * Gemini AI Service (Primary - FREE & Unlimited)
 */
export class GeminiProvider {
  private ai = new GoogleGenerativeAI(API_KEYS.gemini)
  private model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' })

  async generate(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Gemini error:', error)
      throw error
    }
  }

  isAvailable(): boolean {
    return !!API_KEYS.gemini
  }
}

/**
 * Groq AI Service (Ultra-Fast Inference - FREE)
 * Best for: Real-time responses, fast iterations
 */
export class GroqProvider {
  private baseURL = 'https://api.groq.com/openai/v1'

  async generate(prompt: string, model: string = 'llama-3.3-70b-versatile'): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEYS.groq}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('Groq error:', error)
      throw error
    }
  }

  isAvailable(): boolean {
    return !!API_KEYS.groq
  }

  /**
   * Available Groq models (all FREE):
   * - llama-3.3-70b-versatile (Best for general tasks)
   * - llama-3.1-8b-instant (Fastest)
   * - mixtral-8x7b-32768 (Large context)
   * - gemma2-9b-it (Google's model)
   */
  getAvailableModels(): string[] {
    return [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ]
  }
}

/**
 * DeepSeek AI Service (Cost-Effective - FREE Tier)
 * Best for: Code analysis, technical tasks
 */
export class DeepSeekProvider {
  private baseURL = 'https://api.deepseek.com/v1'

  async generate(prompt: string, model: string = 'deepseek-chat'): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEYS.deepseek}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096
        })
      })

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('DeepSeek error:', error)
      throw error
    }
  }

  isAvailable(): boolean {
    return !!API_KEYS.deepseek
  }

  /**
   * Available DeepSeek models:
   * - deepseek-chat (General purpose)
   * - deepseek-coder (Code-specific)
   */
  getAvailableModels(): string[] {
    return ['deepseek-chat', 'deepseek-coder']
  }
}

/**
 * Hugging Face Service (FREE - 15K requests/month)
 * Best for: Specialized models, embeddings
 */
export class HuggingFaceProvider {
  private baseURL = 'https://api-inference.huggingface.co/models'

  async generate(prompt: string, model: string = 'mistralai/Mixtral-8x7B-Instruct-v0.1'): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEYS.huggingface}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 2048,
            temperature: 0.7,
            return_full_text: false
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data[0].generated_text
    } catch (error) {
      console.error('Hugging Face error:', error)
      throw error
    }
  }

  isAvailable(): boolean {
    return !!API_KEYS.huggingface
  }

  /**
   * Available Hugging Face models (FREE):
   * - mistralai/Mixtral-8x7B-Instruct-v0.1 (Best general)
   * - codellama/CodeLlama-34b-Instruct-hf (Code)
   * - meta-llama/Llama-2-70b-chat-hf (Chat)
   */
  getAvailableModels(): string[] {
    return [
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'codellama/CodeLlama-34b-Instruct-hf',
      'meta-llama/Llama-2-70b-chat-hf'
    ]
  }
}

/**
 * Cerebras Service (World's FASTEST AI Inference!)
 * Best for: Ultra-fast responses, real-time applications
 * FREE: 900 requests/hour, 14,400/day, 1M tokens/day
 */
export class CerebrasProvider {
  private baseURL = 'https://api.cerebras.ai/v1'

  async generate(prompt: string, model: string = 'llama3.1-8b'): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEYS.cerebras}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096,
          stream: false
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Cerebras API error: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('Cerebras error:', error)
      throw error
    }
  }

  isAvailable(): boolean {
    return !!API_KEYS.cerebras
  }

  /**
   * Available Cerebras models (ALL FREE!):
   * - llama3.1-8b (Best balance - RECOMMENDED)
   * - llama3.1-70b (Most powerful)
   * - llama-4-scout-17b-16e-instruct (Scout model)
   * - qwen-3-235b-a22b-instruct-2507 (Qwen model)
   */
  getAvailableModels(): string[] {
    return [
      'llama3.1-8b',
      'llama3.1-70b',
      'llama-4-scout-17b-16e-instruct',
      'qwen-3-235b-a22b-instruct-2507'
    ]
  }
}

/**
 * OpenRouter Service (Cost-Optimized, 100+ Models)
 * Best for: Cost optimization, model variety, automatic routing
 */
export class OpenRouterProvider {
  private baseURL = 'https://openrouter.ai/api/v1'

  async generate(prompt: string, model: string = 'meta-llama/llama-3.1-8b-instruct:free'): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEYS.openrouter}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'HireNexa'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4096
        })
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('OpenRouter error:', error)
      throw error
    }
  }

  isAvailable(): boolean {
    return !!API_KEYS.openrouter
  }

  /**
   * Available OpenRouter models (cost-optimized):
   * FREE MODELS:
   * - meta-llama/llama-3.1-8b-instruct:free
   * - google/gemma-2-9b-it:free
   * - mistralai/mistral-7b-instruct:free
   * 
   * COST-OPTIMIZED MODELS:
   * - anthropic/claude-3.5-sonnet (Best quality)
   * - google/gemini-2.0-flash-exp:free (FREE, fast)
   * - meta-llama/llama-3.3-70b-instruct (Good balance)
   * - deepseek/deepseek-chat (Cheapest, 2% of OpenAI cost)
   */
  getAvailableModels(): string[] {
    return [
      // FREE models
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemma-2-9b-it:free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      // Cost-optimized models
      'deepseek/deepseek-chat',
      'meta-llama/llama-3.3-70b-instruct',
      'anthropic/claude-3.5-sonnet'
    ]
  }
}

/**
 * Smart AI Router - Automatically selects best available provider
 */
export class SmartAIRouter {
  private providers = {
    cerebras: new CerebrasProvider(),
    gemini: new GeminiProvider(),
    groq: new GroqProvider(),
    deepseek: new DeepSeekProvider(),
    huggingface: new HuggingFaceProvider(),
    openrouter: new OpenRouterProvider()
  }

  private requestCounts: Record<string, number> = {}
  private lastReset: Date = new Date()

  /**
   * Generate response using best available provider
   */
  async generate(prompt: string, preferredProvider?: string): Promise<{
    response: string
    provider: string
    latency: number
  }> {
    const startTime = Date.now()

    // Reset counters daily
    this.resetCountersIfNeeded()

    // Get available providers sorted by priority
    const availableProviders = this.getAvailableProviders()

    if (availableProviders.length === 0) {
      throw new Error('No AI providers available')
    }

    // Try preferred provider first
    if (preferredProvider && this.providers[preferredProvider as keyof typeof this.providers]) {
      try {
        const response = await this.providers[preferredProvider as keyof typeof this.providers].generate(prompt)
        this.incrementCount(preferredProvider)
        return {
          response,
          provider: preferredProvider,
          latency: Date.now() - startTime
        }
      } catch (error) {
        console.warn(`Preferred provider ${preferredProvider} failed, trying alternatives...`)
      }
    }

    // Try providers in priority order
    for (const providerName of availableProviders) {
      try {
        const provider = this.providers[providerName as keyof typeof this.providers]
        const response = await provider.generate(prompt)
        this.incrementCount(providerName)
        
        return {
          response,
          provider: providerName,
          latency: Date.now() - startTime
        }
      } catch (error) {
        console.warn(`Provider ${providerName} failed, trying next...`)
        continue
      }
    }

    throw new Error('All AI providers failed')
  }

  /**
   * Get available providers sorted by priority and rate limits
   */
  private getAvailableProviders(): string[] {
    return AI_PROVIDERS
      .filter(p => p.available)
      .filter(p => {
        const count = this.requestCounts[p.name] || 0
        return count < p.rateLimit
      })
      .sort((a, b) => a.priority - b.priority)
      .map(p => p.name)
  }

  /**
   * Increment request count for provider
   */
  private incrementCount(provider: string): void {
    this.requestCounts[provider] = (this.requestCounts[provider] || 0) + 1
  }

  /**
   * Reset counters daily
   */
  private resetCountersIfNeeded(): void {
    const now = new Date()
    const hoursSinceReset = (now.getTime() - this.lastReset.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceReset >= 24) {
      this.requestCounts = {}
      this.lastReset = now
    }
  }

  /**
   * Get provider statistics
   */
  getStats(): {
    provider: string
    available: boolean
    requestsToday: number
    rateLimit: number
    percentUsed: number
  }[] {
    return AI_PROVIDERS.map(p => ({
      provider: p.name,
      available: p.available,
      requestsToday: this.requestCounts[p.name] || 0,
      rateLimit: p.rateLimit,
      percentUsed: ((this.requestCounts[p.name] || 0) / p.rateLimit) * 100
    }))
  }
}

// Export singleton
export const smartAIRouter = new SmartAIRouter()

// Export individual providers
export const geminiProvider = new GeminiProvider()
export const groqProvider = new GroqProvider()
export const deepseekProvider = new DeepSeekProvider()
export const huggingfaceProvider = new HuggingFaceProvider()
export const openrouterProvider = new OpenRouterProvider()
