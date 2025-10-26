'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Zap, BookOpen, Plus, Eye } from 'lucide-react'

interface SkillSubmission {
  id: string
  skill_name: string
  skill_category: string
  proficiency_level: string
  status: string
  payment_status: string
  created_at: string
  paid_at: string | null
  completed_at: string | null
}

export default function SkillsPage() {
  const { userId } = useAuth()
  const [skills, setSkills] = useState<SkillSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const fetchSkills = async () => {
      try {
        const response = await fetch('/api/skills/list')
        const data = await response.json()

        if (response.ok) {
          setSkills(data.skills || [])
        } else {
          console.error('Error fetching skills:', data.error)
        }
      } catch (error) {
        console.error('Error fetching skills:', error)
      }
      setLoading(false)
    }

    fetchSkills()
  }, [userId])

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending_payment: { bg: 'bg-amber-500/20', text: 'text-amber-300', label: '💳 Pending Payment' },
      awaiting_review: { bg: 'bg-[#3B82F6]/20', text: 'text-[#3B82F6]', label: '⏳ Awaiting Review' },
      under_review: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: '🔍 Under Review' },
      verified: { bg: 'bg-[#3B82F6]/20', text: 'text-[#3B82F6]', label: '✅ Verified' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-300', label: '❌ Rejected' },
    }

    const badge = badges[status] || { bg: 'bg-white/10', text: 'text-gray-300', label: status }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} border-current/30`}>
        {badge.label}
      </span>
    )
  }

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#3B82F6]" />
              My Skills
            </h1>
            <p className="text-gray-400 text-sm mt-1">Track your skill verification requests</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/peer-review"
              className="px-3 py-2 bg-white/10 border border-white/20 text-gray-300 font-bold rounded-lg hover:bg-white/20 transition text-sm flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Peer Review
            </Link>
            <Link
              href="/dashboard/skills/submit"
              className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Submit Skill
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#3B82F6]">{skills.length}</div>
            <div className="text-xs text-gray-400 mt-1">Total Submissions</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#3B82F6]">
              {skills.filter(s => s.status === 'awaiting_review' || s.status === 'under_review').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">In Review</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#3B82F6]">
              {skills.filter(s => s.status === 'verified').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Verified</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">
              {skills.filter(s => s.status === 'pending_payment').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Pending Payment</div>
          </div>
        </div>

        {/* Skills List */}
        {skills.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-12 text-center">
            <div className="inline-block mb-4 p-4 bg-[#3B82F6]/20 rounded-lg">
              <BookOpen className="w-8 h-8 text-[#3B82F6]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Skills Submitted Yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              Submit your first skill for verification and get recognized by expert peer reviewers.
            </p>
            <Link
              href="/dashboard/skills/submit"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition flex items-center gap-2 justify-center"
            >
              <Plus className="w-5 h-5" />
              Submit Your First Skill
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {skills.map((skill) => (
              <div key={skill.id} className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white mb-1">{skill.skill_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                      <span className="capitalize">{skill.skill_category}</span>
                      <span>•</span>
                      <span className="capitalize">{skill.proficiency_level}</span>
                      <span>•</span>
                      <span>{new Date(skill.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {getStatusBadge(skill.status)}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {skill.status === 'pending_payment' && (
                    <Link
                      href={`/dashboard/skills/payment/${skill.id}`}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-300 font-bold rounded-lg border border-amber-500/50 hover:bg-amber-500/30 transition text-xs"
                    >
                      💳 Complete Payment
                    </Link>
                  )}
                  {skill.status === 'verified' && (
                    <button className="px-3 py-1.5 bg-[#3B82F6]/20 text-[#3B82F6] font-bold rounded-lg border border-[#3B82F6]/50 text-xs">
                      ✅ View Certificate
                    </button>
                  )}
                  {skill.status === 'rejected' && (
                    <Link
                      href="/dashboard/skills/submit"
                      className="px-3 py-1.5 bg-[#3B82F6]/20 text-[#3B82F6] font-bold rounded-lg border border-[#3B82F6]/50 hover:bg-[#3B82F6]/30 transition text-xs"
                    >
                      🔄 Resubmit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
