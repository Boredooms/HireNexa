'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react'

interface PeerReviewerApp {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  expertise_areas: string[]
  years_experience: number
  applied_at: string
}

export default function PeerReviewPage() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const [application, setApplication] = useState<PeerReviewerApp | null>(null)
  const [availableSkills, setAvailableSkills] = useState<any[]>([])
  const [myReviews, setMyReviews] = useState<any[]>([])
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, paid: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Wait for auth to load
    if (!isLoaded) return

    // Redirect if not authenticated
    if (!userId) {
      router.push('/sign-in')
      return
    }

    // Get peer reviewer application
    const fetchApplication = async () => {
      console.log('🔍 Fetching application for user:', userId)
      const { data, error } = await supabase
        .from('peer_reviewer_applications')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.log('❌ Error fetching application:', error)
        console.log('ℹ️ This is normal if you haven\'t applied yet')
      } else {
        console.log('✅ Application found:', data)
        console.log('📊 Application status:', data?.status)
        console.log('👤 User ID:', userId)
      }
      
      setApplication(data)
      
      // Debug: Log what we're checking
      console.log('🔍 Checking approval status:', {
        hasApplication: !!data,
        status: data?.status,
        isApproved: data?.status === 'approved'
      })

      // If approved, fetch available skills and earnings
      if (data && data.status === 'approved') {
        fetchAvailableSkills()
        fetchMyReviews()
        fetchEarnings()
      }

      setLoading(false)
    }

    const fetchAvailableSkills = async () => {
      const response = await fetch('/api/skills/available-for-review')
      if (response.ok) {
        const data = await response.json()
        setAvailableSkills(data.skills || [])
      }
    }

    const fetchMyReviews = async () => {
      const { data } = await supabase
        .from('skill_verification_reviews')
        .select(`
          *,
          submission:submission_id (
            skill_name,
            skill_category
          )
        `)
        .eq('reviewer_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      setMyReviews(data || [])
    }

    const fetchEarnings = async () => {
      const { data } = await supabase
        .from('reviewer_earnings')
        .select('amount, status')
        .eq('reviewer_id', userId)

      if (data) {
        const total = data.reduce((sum, e) => sum + parseFloat(e.amount), 0)
        const paid = data.filter(e => e.status === 'paid').reduce((sum, e) => sum + parseFloat(e.amount), 0)
        const pending = total - paid

        setEarnings({ total, pending, paid })
      }
    }

    fetchApplication()
  }, [userId, isLoaded, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex items-center justify-center">
        <div className="text-xl font-bold text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Eye className="w-6 h-6 text-[#3B82F6]" />
              Peer Review Network
            </h1>
            <p className="text-gray-400 text-sm mt-1">Verify skills and earn rewards in cUSD</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/skills"
              className="px-3 py-2 bg-white/10 border border-white/20 text-gray-300 font-bold rounded-lg hover:bg-white/20 transition text-sm flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              My Skills
            </Link>
            <Link
              href="/dashboard/skills/submit"
              className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm"
            >
              + Submit Skill
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Verifier Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#3B82F6]">{availableSkills.length}</div>
            <div className="text-xs text-gray-400 mt-1">Available to Review</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#3B82F6]">{myReviews.length}</div>
            <div className="text-xs text-gray-400 mt-1">Total Reviews</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">{earnings.pending.toFixed(1)} cUSD</div>
            <div className="text-xs text-gray-400 mt-1">Pending Earnings</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#3B82F6]">{earnings.total.toFixed(1)} cUSD</div>
            <div className="text-xs text-gray-400 mt-1">Total Earned</div>
          </div>
        </div>

        {/* Quick Actions for Approved Reviewers */}
        {application && application.status === 'approved' && (
          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <Link
              href="/dashboard/skills/submit"
              className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 transition group"
            >
              <div className="text-3xl mb-2">📝</div>
              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[#3B82F6]">Submit a Skill</h3>
              <p className="text-xs text-gray-400">Get your own skills verified by peer reviewers</p>
            </Link>
            
            <Link
              href="/dashboard/skills"
              className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 transition group"
            >
              <div className="text-3xl mb-2">📚</div>
              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[#3B82F6]">My Skills</h3>
              <p className="text-xs text-gray-400">View your submitted skills and verification status</p>
            </Link>

            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-sm font-bold text-white mb-1">Earnings</h3>
              <div className="text-lg font-bold text-[#3B82F6]">{earnings.total.toFixed(1)} cUSD</div>
              <p className="text-xs text-gray-400">Total earned from reviews</p>
            </div>
          </div>
        )}

        {/* Application Status */}
        {!application && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <h3 className="text-base font-bold text-amber-300 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Become a Skill Verifier
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Apply as a peer reviewer to verify skills and earn 5 cUSD per verification!
            </p>
            <Link
              href="/dashboard/peer-review/apply"
              className="inline-block px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm"
            >
              Apply Now
            </Link>
          </div>
        )}

        {application && application.status === 'pending' && (
          <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg p-4 mb-6">
            <h3 className="text-base font-bold text-[#3B82F6] mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Application Under Review
            </h3>
            <p className="text-gray-400 text-sm mb-1">
              Your peer reviewer application is being reviewed by our admin team.
            </p>
            <p className="text-xs text-gray-500">
              Applied on: {new Date(application.applied_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {application && application.status === 'rejected' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <h3 className="text-base font-bold text-red-300 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Application Rejected
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Unfortunately, your application was not approved. You can apply again with updated information.
            </p>
            <Link
              href="/dashboard/peer-review/apply"
              className="inline-block px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm"
            >
              Apply Again
            </Link>
          </div>
        )}

        {application && application.status === 'approved' && (
          <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg p-4 mb-6">
            <h3 className="text-base font-bold text-[#3B82F6] mb-1 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              You're an Approved Peer Reviewer!
            </h3>
            <p className="text-gray-400 text-sm">
              Start verifying skills below and earn 5 cUSD per verification.
            </p>
          </div>
        )}

        {/* Skills Needing Verification */}
        {application && application.status === 'approved' && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-black mb-4">
              🔍 Skills Available for Review
            </h2>
            {availableSkills.length === 0 ? (
              <div className="bg-white border-2 border-black rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-bold text-black mb-2">No Skills Available</h3>
                <p className="text-gray-600">
                  Check back later for new skill verification requests!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {availableSkills.map((skill) => (
                  <div key={skill.id} className="bg-white border-2 border-black rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-black">{skill.skill_name}</h3>
                          <span className="px-3 py-1 bg-[#FCFF52] border-2 border-black rounded-full text-sm font-bold">
                            5 cUSD Reward
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="capitalize">{skill.skill_category}</span>
                          <span>•</span>
                          <span className="capitalize">{skill.proficiency_level}</span>
                          <span>•</span>
                          <span>{new Date(skill.paid_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {skill.description.substring(0, 150)}...
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/peer-review/verify/${skill.id}`}
                        className="ml-4 px-4 py-2 bg-[#35D07F] text-white font-bold rounded border-2 border-black hover:bg-green-600 transition whitespace-nowrap"
                      >
                        Review Skill →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard - Empty State */}
        <div>
          <h2 className="text-xl font-bold text-black mb-4">🏆 Top Verifiers</h2>
          <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Verifier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Reputation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Reviews
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Earned
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No verifiers yet. Be the first to apply!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
