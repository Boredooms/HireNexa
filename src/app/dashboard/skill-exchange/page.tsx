'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRealtimePresence } from '@/hooks/useRealtimePresence'
import { ArrowRightLeft, Users, MessageSquare, Video } from 'lucide-react'

interface SkillMatch {
  id: string
  user_id: string
  name: string
  avatar_url: string
  skills_offered: string[]
  skills_wanted: string[]
  interests: string[]
  match_score: number
  online: boolean
  last_active: string
  bio: string
  experience_level: string
  availability: string
  barter_status?: 'none' | 'pending' | 'accepted' | 'active' // Added for barter tracking
  barter_id?: string
}

export default function SkillExchangePage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<SkillMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<SkillMatch | null>(null)
  const [filter, setFilter] = useState<'all' | 'online' | 'top-matches'>('all')
  
  // Real-time presence tracking
  const { isOnline } = useRealtimePresence(userId || '')

  useEffect(() => {
    initializeProfile()
  }, [])

  useEffect(() => {
    loadMatches()
  }, [filter])

  const initializeProfile = async () => {
    try {
      // Auto-create profile from existing user data
      await fetch('/api/skill-exchange/profile/auto-create', {
        method: 'POST'
      })
      // Then load matches
      loadMatches()
    } catch (error) {
      console.error('Error initializing profile:', error)
      loadMatches() // Try to load anyway
    }
  }

  const loadMatches = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching matches with filter:', filter)
      const response = await fetch(`/api/skill-exchange/matches?filter=${filter}`)
      console.log('📡 Response status:', response.status)
      const data = await response.json()
      console.log('📦 Matches data:', data)
      console.log('✅ Total matches found:', data.matches?.length || 0)
      setMatches(data.matches || [])
    } catch (error) {
      console.error('❌ Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const startVideoCall = (matchId: string) => {
    router.push(`/dashboard/skill-exchange/video/${matchId}`)
  }

  const startChat = (matchId: string) => {
    router.push(`/dashboard/skill-exchange/chat/${matchId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-[#3B82F6]" />
                Skill Exchange
              </h1>
              <p className="text-gray-400 text-sm mt-1">Match, barter, and learn new skills</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard/skill-exchange/my-profile"
                className="px-4 py-2 border border-white/20 bg-white/10 rounded-lg font-bold text-gray-300 hover:bg-white/20 transition text-sm"
              >
                My Profile
              </Link>
              <Link
                href="/dashboard/skill-exchange/history"
                className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg font-bold text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm"
              >
                Exchange History
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex gap-3 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-bold transition text-sm ${
                filter === 'all' ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-lg shadow-[#3B82F6]/50' : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setFilter('online')}
              className={`px-4 py-2 rounded-lg font-bold transition text-sm ${
                filter === 'online' ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-lg shadow-[#3B82F6]/50' : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              🟢 Online Now
            </button>
            <button
              onClick={() => setFilter('top-matches')}
              className={`px-4 py-2 rounded-lg font-bold transition text-sm ${
                filter === 'top-matches' ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-lg shadow-[#3B82F6]/50' : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              ⭐ Top Matches
            </button>
          </div>
        </div>

        {/* Info Banner - IMPROVED READABILITY */}
        <div className="mb-6 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl flex-shrink-0">💡</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3 text-white">How Skill Exchange Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-lg p-3">
                  <div className="text-lg font-bold mb-1 text-white">1. Match</div>
                  <div className="text-sm font-semibold text-gray-400">Find people with skills you want who want your skills</div>
                </div>
                <div className="bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-lg p-3">
                  <div className="text-lg font-bold mb-1 text-white">2. Connect</div>
                  <div className="text-sm font-semibold text-gray-400">Video call or chat to discuss the exchange</div>
                </div>
                <div className="bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-lg p-3">
                  <div className="text-lg font-bold mb-1 text-white">3. Barter</div>
                  <div className="text-sm font-semibold text-gray-400">Exchange skills and record on blockchain</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Matches Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl font-bold text-white">Finding your perfect matches...</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-3 text-white">No Matches Yet</h3>
            <p className="text-base font-semibold text-gray-400 mb-6 max-w-md mx-auto">
              Complete your skill exchange profile to start matching with people who want to learn what you know!
            </p>
            <Link
              href="/dashboard/skill-exchange/my-profile"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-lg font-bold hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm"
            >
              Complete Profile →
            </Link>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
              <div className="bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-lg p-4">
                <div className="text-2xl mb-2">📝</div>
                <div className="font-bold text-sm mb-1 text-white">Add Skills</div>
                <div className="text-xs font-semibold text-gray-400">List skills you can teach and want to learn</div>
              </div>
              <div className="bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-lg p-4">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-bold text-sm mb-1 text-white">Get Matched</div>
                <div className="text-xs font-semibold text-gray-400">AI finds perfect skill exchange partners</div>
              </div>
              <div className="bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-lg p-4">
                <div className="text-2xl mb-2">🚀</div>
                <div className="font-bold text-sm mb-1 text-white">Start Learning</div>
                <div className="text-xs font-semibold text-gray-400">Video call, chat, and exchange skills</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden hover:bg-white/10 transition-all"
              >
                {/* Profile Header */}
                <div className="relative">
                  <div className="h-24 bg-gradient-to-br from-[#3B82F6] to-[#2563EB]"></div>
                  <div className="absolute -bottom-8 left-4">
                    <div className="w-20 h-20 bg-gray-400 border-4 border-white/20 rounded-full flex items-center justify-center text-3xl">
                      {match.avatar_url ? (
                        <img src={match.avatar_url} alt={match.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        '👤'
                      )}
                    </div>
                  </div>
                  {isOnline(match.user_id) && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-[#3B82F6] border border-white/20 rounded-full text-white text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Online
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="pt-10 px-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-white">{match.name}</h3>
                    <span className="px-2 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">
                      {match.match_score}% Match
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-3">{match.bio}</p>

                  {/* Skills Offered */}
                  <div className="mb-2">
                    <div className="text-xs font-bold text-gray-400 mb-1">Offers:</div>
                    <div className="flex flex-wrap gap-1">
                      {match.skills_offered.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded text-xs font-semibold text-[#3B82F6]"
                        >
                          {skill}
                        </span>
                      ))}
                      {match.skills_offered.length > 3 && (
                        <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-xs font-semibold text-gray-400">
                          +{match.skills_offered.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills Wanted */}
                  <div className="mb-3">
                    <div className="text-xs font-bold text-gray-400 mb-1">Wants:</div>
                    <div className="flex flex-wrap gap-1">
                      {match.skills_wanted.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded text-xs font-semibold text-[#3B82F6]"
                        >
                          {skill}
                        </span>
                      ))}
                      {match.skills_wanted.length > 3 && (
                        <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-xs font-semibold text-gray-400">
                          +{match.skills_wanted.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Show Propose Barter button if no barter exists */}
                    {(!match.barter_status || match.barter_status === 'none') && (
                      <>
                        <button
                          onClick={() => router.push(`/dashboard/skill-exchange/propose-barter/${match.id}`)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded font-bold text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm flex items-center justify-center gap-2"
                        >
                          🤝 Propose Barter
                        </button>
                        <div className="bg-amber-500/10 border border-amber-500/50 rounded p-2 text-xs font-bold text-center text-amber-300">
                          🔒 Lock funds to enable chat
                        </div>
                      </>
                    )}

                    {/* Show pending status */}
                    {match.barter_status === 'pending' && (
                      <button
                        onClick={() => router.push(`/dashboard/skill-exchange/barter/${match.barter_id}`)}
                        className="w-full bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded p-2 text-center hover:bg-[#3B82F6]/30 transition"
                      >
                        <div className="font-bold text-[#3B82F6] text-sm">⏳ Barter Pending</div>
                        <div className="text-xs text-[#3B82F6]/70 mt-0.5">Click to view details</div>
                      </button>
                    )}

                    {/* Show accepted/active status with enabled buttons */}
                    {(match.barter_status === 'accepted' || match.barter_status === 'active') && (
                      <>
                        <div className="bg-green-500/20 border border-green-500/50 rounded p-2 text-center">
                          <div className="font-bold text-green-300">✅ Barter Active</div>
                          <div className="text-xs text-green-400">Video & Chat enabled!</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/skill-exchange/video/${match.id}`)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded font-bold text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition flex items-center justify-center gap-2"
                          >
                            📹 Video
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/skill-exchange/chat/${match.id}`)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded font-bold text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition flex items-center justify-center gap-2"
                          >
                            💬 Chat
                          </button>
                        </div>
                      </>
                    )}

                    {/* Fallback: Show disabled buttons if status unknown */}
                    {!match.barter_status && (
                      <div className="flex gap-2 opacity-50">
                        <button
                          disabled
                          className="flex-1 px-4 py-2 bg-gray-500/20 border border-gray-500/50 rounded font-bold text-gray-500 cursor-not-allowed flex items-center justify-center gap-2"
                          title="Propose escrow barter first"
                        >
                          📹 Video
                        </button>
                        <button
                          disabled
                          className="flex-1 px-4 py-2 bg-gray-500/20 border border-gray-500/50 rounded font-bold text-gray-500 cursor-not-allowed flex items-center justify-center gap-2"
                          title="Propose escrow barter first"
                        >
                          💬 Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
