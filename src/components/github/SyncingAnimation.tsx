'use client'

import { useState, useEffect } from 'react'

interface SyncingAnimationProps {
  currentStep?: string
}

const SYNC_STEPS = [
  { id: 1, text: 'Connecting to GitHub...', duration: 1000, icon: '🔗' },
  { id: 2, text: 'Fetching your repositories...', duration: 2000, icon: '📦' },
  { id: 3, text: 'Multi-Agent AI Analysis (6 agents)...', duration: 8000, icon: '🤖' },
  { id: 4, text: 'Profile scanning (Cerebras AI)...', duration: 3000, icon: '👤' },
  { id: 5, text: 'Deep code analysis (Groq 120B)...', duration: 4000, icon: '🔍' },
  { id: 6, text: 'AI code detection & verification...', duration: 3000, icon: '🎯' },
  { id: 7, text: 'Skill extraction (20-30 skills)...', duration: 4000, icon: '💎' },
  { id: 8, text: 'Generating professional summary...', duration: 3000, icon: '📝' },
  { id: 9, text: 'Encrypting with AES-256-GCM...', duration: 2000, icon: '🔒' },
  { id: 10, text: 'Uploading to IPFS (Pinata)...', duration: 3000, icon: '☁️' },
  { id: 11, text: 'Creating NFT metadata...', duration: 2000, icon: '🎨' },
  { id: 12, text: 'Finalizing portfolio...', duration: 1000, icon: '✨' },
]

const FUN_FACTS = [
  '💡 Did you know? Your portfolio is encrypted with military-grade AES-256-GCM!',
  '🔐 Fun fact: Only you can decrypt your full portfolio data!',
  '🌐 Cool! Your portfolio is stored on IPFS - a decentralized network!',
  '🎨 Nice! You can mint your portfolio as an NFT on Celo blockchain!',
  '⚡ Pro tip: Update your portfolio every 3 months to keep it fresh!',
  '🚀 Amazing! 6 AI agents analyze your code simultaneously!',
  '🔗 Blockchain fact: Your NFT is immutable and tamper-proof!',
  '💎 Did you know? You own your portfolio NFT - not the platform!',
  '🤖 AI Magic: Cerebras (70B) + Groq (120B) + Gemini analyze your code!',
  '📊 Smart! Your skills are scored with natural percentages (73%, 82%)!',
  '🎯 Accurate! Multi-agent system achieves 91% accuracy vs 68% before!',
  '⚡ Fast! Cerebras processes 1,800 tokens/second - ultra-fast AI!',
  '🔒 Secure! All data encrypted before leaving your browser!',
  '🌟 Unique! Natural analysis makes your portfolio look human-made!',
  '💰 Free! All AI providers (Cerebras, Groq, Gemini) are 100% FREE!',
]

export function SyncingAnimation({ currentStep }: SyncingAnimationProps) {
  const [progress, setProgress] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [funFactIndex, setFunFactIndex] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // Mini game state - Card Flip Memory Game
  const [gameScore, setGameScore] = useState(0)
  const [showGame, setShowGame] = useState(true)
  const [cards, setCards] = useState<Array<{ id: number; emoji: string; flipped: boolean; matched: boolean }>>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)

  // Progress bar animation
  useEffect(() => {
    const totalDuration = SYNC_STEPS.reduce((sum, step) => sum + step.duration, 0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev // Cap at 95% until actually done
        return Math.min(prev + (100 / totalDuration) * 100, 95)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Step progression
  useEffect(() => {
    let accumulatedTime = 0
    const stepInterval = setInterval(() => {
      accumulatedTime += 1000
      
      // Find current step based on accumulated time
      let totalTime = 0
      for (let i = 0; i < SYNC_STEPS.length; i++) {
        totalTime += SYNC_STEPS[i].duration
        if (accumulatedTime < totalTime) {
          setCurrentStepIndex(i)
          break
        }
      }
    }, 1000)

    return () => clearInterval(stepInterval)
  }, [])

  // Fun facts rotation
  useEffect(() => {
    const factInterval = setInterval(() => {
      setFunFactIndex((prev) => (prev + 1) % FUN_FACTS.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(factInterval)
  }, [])

  // Elapsed time counter
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  // Initialize card game
  useEffect(() => {
    if (!showGame) return
    
    // Celo-themed emojis
    const emojis = ['💰', '🔗', '🎨', '🔒', '⚡', '🌟', '💎', '🚀']
    const gameCards = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false,
      }))
    
    setCards(gameCards)
    setGameScore(0)
    setMoves(0)
    setFlippedCards([])
  }, [showGame])

  // Handle card flip
  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return
    if (cards[cardId].flipped || cards[cardId].matched) return
    
    const newCards = [...cards]
    newCards[cardId].flipped = true
    setCards(newCards)
    
    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)
    
    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1)
      
      const [first, second] = newFlipped
      if (cards[first].emoji === cards[second].emoji) {
        // Match found!
        setTimeout(() => {
          const matchedCards = [...cards]
          matchedCards[first].matched = true
          matchedCards[second].matched = true
          setCards(matchedCards)
          setFlippedCards([])
          setGameScore(prev => prev + 10)
        }, 500)
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...cards]
          resetCards[first].flipped = false
          resetCards[second].flipped = false
          setCards(resetCards)
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const estimatedTimeRemaining = Math.max(0, 40 - elapsedTime) // 40 seconds estimate

  return (
    <div className="space-y-6">
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-gray-700">
            {SYNC_STEPS[currentStepIndex]?.icon} {SYNC_STEPS[currentStepIndex]?.text}
          </span>
          <span className="text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-black">
          <div
            className="h-full bg-[#FCFF52] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Time Info */}
      <div className="flex justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏱️</span>
          <span>Elapsed: {formatTime(elapsedTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏳</span>
          <span>~{formatTime(estimatedTimeRemaining)} remaining</span>
        </div>
      </div>

      {/* Steps Checklist */}
      <div className="p-4 bg-gray-50 rounded-lg border-2 border-black">
        <h4 className="font-semibold text-black mb-3">Progress:</h4>
        <div className="space-y-2">
          {SYNC_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 text-sm transition-all ${
                index < currentStepIndex
                  ? 'text-green-600'
                  : index === currentStepIndex
                  ? 'text-black font-semibold'
                  : 'text-gray-400'
              }`}
            >
              <span className="text-xl">
                {index < currentStepIndex ? '✅' : index === currentStepIndex ? '⏳' : '⏸️'}
              </span>
              <span>{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fun Facts Carousel */}
      <div className="p-4 bg-blue-50 border-2 border-black rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-3xl">💡</span>
          <div>
            <h4 className="font-semibold text-black mb-1">While you wait...</h4>
            <p className="text-sm text-gray-700 animate-fade-in">
              {FUN_FACTS[funFactIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* Mini Game - Card Flip Memory */}
      {showGame && (
        <div className="p-6 bg-gradient-to-br from-yellow-50 to-green-50 border-2 border-black rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-black text-lg">🎮 Celo Memory Match!</h4>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-black">Score: {gameScore}</span>
              <span className="text-sm text-gray-700">Moves: {moves}</span>
              <button
                onClick={() => setShowGame(false)}
                className="text-sm text-gray-600 hover:text-black font-semibold"
              >
                Hide Game
              </button>
            </div>
          </div>
          
          {/* Card Grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.matched}
                className={`
                  aspect-square rounded-lg border-2 border-black text-4xl
                  transition-all duration-300 transform
                  ${card.flipped || card.matched 
                    ? 'bg-white scale-100' 
                    : 'bg-[#FCFF52] hover:bg-[#35D07F] hover:scale-105'
                  }
                  ${card.matched ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  active:scale-95
                `}
              >
                {card.flipped || card.matched ? card.emoji : '❓'}
              </button>
            ))}
          </div>
          
          <div className="flex justify-between items-center text-xs text-gray-700">
            <p>💡 Match all pairs to win!</p>
            <p>🏆 +10 points per match</p>
          </div>
        </div>
      )}

      {!showGame && (
        <button
          onClick={() => setShowGame(true)}
          className="w-full p-3 bg-[#FCFF52] text-black rounded-lg font-semibold hover:bg-[#35D07F] border-2 border-black transition"
        >
          🎮 Play Mini Game
        </button>
      )}

      {/* Animated Dots */}
      <div className="flex justify-center items-center gap-2">
        <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>

      {/* Motivational Message */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          🚀 Hang tight! We're analyzing your code to build an amazing portfolio!
        </p>
      </div>
    </div>
  )
}
