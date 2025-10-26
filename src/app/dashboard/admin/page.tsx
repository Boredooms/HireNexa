'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useRealtimeVerifiers } from '@/hooks/useRealtimeVerifiers'
import { DashboardSidebar } from '@/components/DashboardNav'
import { CheckCircle, XCircle, Users, Briefcase } from 'lucide-react'

interface PendingVerifier {
  id: string
  user_id: string
  expertise_areas: string[]
  years_experience: number
  github_profile?: string
  linkedin_profile?: string
  portfolio_url?: string
  why_verify_skills: string
  status: string
  is_authorized?: boolean
  created_at: string
  applied_at: string
}

interface RecruiterApplication {
  id: string
  user_id: string
  company_name: string
  company_website?: string
  company_description: string
  years_hiring_experience?: number
  linkedin_profile?: string
  why_join_platform: string
  expected_monthly_postings?: number
  status: 'pending' | 'approved' | 'rejected'
  applied_at: string
}

export default function AdminPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const { verifiers, loading: verifiersLoading } = useRealtimeVerifiers()
  const [recruiters, setRecruiters] = useState<RecruiterApplication[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // Map verifiers to pendingVerifiers format
  const pendingVerifiers = verifiers as unknown as PendingVerifier[]

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/user/role')
        if (response.ok) {
          const data = await response.json()
          if (!data.isAdmin) {
            router.push('/dashboard')
            return
          }
          setIsAdmin(true)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/dashboard')
      } finally {
        setCheckingAuth(false)
      }
    }
    
    if (userId) {
      checkAdminStatus()
    }
  }, [userId, router])

  // Fetch recruiter applications
  useEffect(() => {
    const fetchRecruiters = async () => {
      try {
        const response = await fetch('/api/admin/get-applications', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        })
        if (response.ok) {
          const data = await response.json()
          console.log('✅ API Response received:', data)
          console.log('📋 Recruiter Applications:', data.recruiterApplications)
          console.log('📊 Stats:', data.stats)
          setRecruiters(data.recruiterApplications || [])
          setStats(data.stats)
        } else {
          console.error('❌ API Error:', response.status, response.statusText)
          const errorData = await response.json()
          console.error('Error details:', errorData)
        }
      } catch (error) {
        console.error('❌ Error fetching recruiters:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecruiters()
  }, [])

  const handleApproveRecruiter = async (recruiterId: string) => {
    setProcessing(recruiterId)
    try {
      const response = await fetch('/api/admin/recruiter/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterId }),
      })

      if (response.ok) {
        alert('Recruiter approved successfully! ✅')
        // Refresh recruiters list and stats
        const refreshResponse = await fetch('/api/admin/get-applications')
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setRecruiters(data.recruiterApplications || [])
          setStats(data.stats)
        }
      } else {
        alert('Failed to approve recruiter')
      }
    } catch (error) {
      console.error('Error approving recruiter:', error)
      alert('Error approving recruiter')
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectRecruiter = async (recruiterId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    setProcessing(recruiterId)
    try {
      const response = await fetch('/api/admin/recruiter/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterId, reason }),
      })

      if (response.ok) {
        alert('Recruiter rejected ❌')
        // Refresh recruiters list
        const refreshResponse = await fetch('/api/admin/get-applications')
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setRecruiters(data.recruiterApplications || [])
        }
      } else {
        alert('Failed to reject recruiter')
      }
    } catch (error) {
      console.error('Error rejecting recruiter:', error)
      alert('Error rejecting recruiter')
    } finally {
      setProcessing(null)
    }
  }

  const handleApprove = async (verifierId: string) => {
    setProcessing(verifierId)
    try {
      const response = await fetch('/api/admin/peer-reviewer/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifierId }),
      })

      if (response.ok) {
        alert('Peer reviewer approved successfully! ✅')
        // Refresh the page
        window.location.reload()
      } else {
        alert('Failed to approve peer reviewer')
      }
    } catch (error) {
      console.error('Error approving peer reviewer:', error)
      alert('Error approving peer reviewer')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (verifierId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    setProcessing(verifierId)
    try {
      const response = await fetch('/api/admin/peer-reviewer/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifierId, reason }),
      })

      if (response.ok) {
        alert('Peer reviewer rejected ❌')
        // Refresh the page
        window.location.reload()
      } else {
        alert('Failed to reject peer reviewer')
      }
    } catch (error) {
      console.error('Error rejecting peer reviewer:', error)
      alert('Error rejecting peer reviewer')
    } finally {
      setProcessing(null)
    }
  }

  if (checkingAuth || loading || verifiersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex items-center justify-center">
        <div className="text-xl font-bold text-white">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect
  }

  const pendingRecruiters = recruiters.filter((r) => r.status === 'pending')
  const approvedRecruiters = recruiters.filter((r) => r.status === 'approved')

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">🛡️ Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Review and approve recruiters & skill verifiers</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3B82F6]">
                  {stats?.recruiters?.pending || 0}
                </div>
                <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Pending Recruiters</div>
              </div>
              <Briefcase className="w-8 h-8 text-[#3B82F6]/50 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3B82F6]">
                  {stats?.peerReviewers?.pending || 0}
                </div>
                <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Pending Verifiers</div>
              </div>
              <Users className="w-8 h-8 text-[#3B82F6]/50 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3B82F6]">
                  {(stats?.recruiters?.approved || 0) + (stats?.peerReviewers?.approved || 0)}
                </div>
                <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Approved Total</div>
              </div>
              <CheckCircle className="w-8 h-8 text-[#3B82F6]/50 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3B82F6]">
                  {(stats?.recruiters?.pending || 0) + (stats?.recruiters?.approved || 0) + (stats?.recruiters?.rejected || 0) + (stats?.peerReviewers?.pending || 0) + (stats?.peerReviewers?.approved || 0) + (stats?.peerReviewers?.rejected || 0)}
                </div>
                <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Total Applications</div>
              </div>
              <Briefcase className="w-8 h-8 text-[#3B82F6]/50 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        {/* Pending Recruiters */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-6">💼 Pending Recruiter Applications</h2>

          {pendingRecruiters.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-base">No pending recruiter applications</p>
              <p className="text-sm mt-2">All recruiters have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRecruiters.map((recruiter) => (
                <div
                  key={recruiter.id}
                  className="border border-white/20 rounded-lg p-5 bg-white/5 hover:bg-white/10 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {recruiter.company_name}
                      </h3>
                      <p className="text-xs text-gray-400">User ID: {recruiter.user_id}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Applied</div>
                      <div className="text-xs font-bold text-gray-300">
                        {new Date(recruiter.applied_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs font-bold text-gray-300 mb-1 uppercase tracking-wide">Company Description</div>
                      <div className="text-sm text-gray-400">{recruiter.company_description}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-300 mb-1 uppercase tracking-wide">Hiring Experience</div>
                      <div className="text-lg font-bold text-[#3B82F6]">
                        {recruiter.years_hiring_experience || 'Not specified'} years
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="mb-3 space-y-1 text-sm">
                    {recruiter.company_website && (
                      <div>
                        <span className="text-xs font-bold text-gray-300">Website: </span>
                        <a
                          href={recruiter.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#3B82F6] hover:text-[#60A5FA] transition"
                        >
                          {recruiter.company_website}
                        </a>
                      </div>
                    )}
                    {recruiter.linkedin_profile && (
                      <div>
                        <span className="text-xs font-bold text-gray-300">LinkedIn: </span>
                        <a
                          href={recruiter.linkedin_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#3B82F6] hover:text-[#60A5FA] transition"
                        >
                          {recruiter.linkedin_profile}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Why Join */}
                  <div className="mb-3">
                    <div className="text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Why they want to join Hirenexa:
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded p-2 text-xs text-gray-400">
                      {recruiter.why_join_platform}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRecruiter(recruiter.user_id)}
                      disabled={processing === recruiter.user_id}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {processing === recruiter.user_id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectRecruiter(recruiter.user_id)}
                      disabled={processing === recruiter.user_id}
                      className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-300 font-bold rounded-lg hover:bg-red-500/30 transition disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      {processing === recruiter.user_id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Verifiers */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">⏳ Pending Verifier Applications</h2>

          {pendingVerifiers.filter((v) => !v.is_authorized).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-base">No pending applications</p>
              <p className="text-sm mt-2">All verifiers have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVerifiers
                .filter((v) => !v.is_authorized)
                .map((verifier) => (
                  <div
                    key={verifier.id}
                    className="border border-white/20 rounded-lg p-5 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-bold text-white">
                          Peer Reviewer Application
                        </h3>
                        <p className="text-xs text-gray-400">User ID: {verifier.user_id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Applied</div>
                        <div className="text-xs font-bold text-gray-300">
                          {new Date(verifier.applied_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">Expertise Areas</div>
                        <div className="flex flex-wrap gap-1.5">
                          {verifier.expertise_areas.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-[#3B82F6]/20 text-[#3B82F6] text-xs font-bold rounded border border-[#3B82F6]/50"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-300 mb-1 uppercase tracking-wide">Experience</div>
                        <div className="text-lg font-bold text-[#3B82F6]">
                          {verifier.years_experience} years
                        </div>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="mb-3 space-y-1 text-sm">
                      {verifier.github_profile && (
                        <div>
                          <span className="text-xs font-bold text-gray-300">GitHub: </span>
                          <a
                            href={verifier.github_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#3B82F6] hover:text-[#60A5FA] transition"
                          >
                            {verifier.github_profile}
                          </a>
                        </div>
                      )}
                      {verifier.linkedin_profile && (
                        <div>
                          <span className="text-xs font-bold text-gray-300">LinkedIn: </span>
                          <a
                            href={verifier.linkedin_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#3B82F6] hover:text-[#60A5FA] transition"
                          >
                            {verifier.linkedin_profile}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Why Verify */}
                    {verifier.why_verify_skills && (
                      <div className="mb-3">
                        <div className="text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                          Why they want to be a verifier:
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded p-2 text-xs text-gray-400">
                          {verifier.why_verify_skills}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(verifier.user_id)}
                        disabled={processing === verifier.user_id}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {processing === verifier.user_id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(verifier.user_id)}
                        disabled={processing === verifier.user_id}
                        className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-300 font-bold rounded-lg hover:bg-red-500/30 transition disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        {processing === verifier.user_id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Approved Verifiers */}
        {pendingVerifiers.filter((v) => v.is_authorized).length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 mt-8">
            <h2 className="text-lg font-bold text-white mb-6">✅ Approved Verifiers</h2>
            <div className="space-y-3">
              {pendingVerifiers
                .filter((v) => v.is_authorized)
                .map((verifier) => (
                  <div
                    key={verifier.id}
                    className="border border-[#3B82F6]/30 rounded-lg p-4 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white">
                          {verifier.user_id}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {verifier.expertise_areas.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Status</div>
                        <div className="text-sm font-bold text-[#3B82F6] flex items-center gap-1 justify-end">
                          <CheckCircle className="w-4 h-4" />
                          Approved
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
