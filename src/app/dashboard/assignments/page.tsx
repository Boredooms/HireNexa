'use client'

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useRealtimeAssignments } from '@/hooks'
import { useState, useEffect } from 'react'
import { Target, Plus } from 'lucide-react'

export default function AssignmentsPage() {
  const { userId } = useAuth()
  const { assignments, loading, error } = useRealtimeAssignments()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<{isRecruiter: boolean, isAdmin: boolean} | null>(null)

  // Fetch user role
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await fetch('/api/user/role')
        if (response.ok) {
          const data = await response.json()
          setUserRole({
            isRecruiter: data.is_recruiter || data.role === 'recruiter',
            isAdmin: data.is_admin || data.role === 'admin'
          })
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }
    if (userId) {
      fetchUserRole()
    }
  }, [userId])

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This cannot be undone.')) {
      return
    }

    setDeleting(assignmentId)
    try {
      const response = await fetch(`/api/assignments/delete?id=${assignmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete assignment')
      }

      alert('Assignment deleted successfully!')
      window.location.reload()
    } catch (error: any) {
      console.error('Error deleting assignment:', error)
      alert('Failed to delete assignment: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex items-center justify-center">
        <div className="text-xl font-bold text-white">Loading assignments...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-[#3B82F6]" />
            Assignment Marketplace
          </h1>
          <p className="text-gray-400 mt-1">Complete real-world tasks, earn CELO, get certified on blockchain</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* AI Matches Section - Coming Soon */}
        {false && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">🎯 Perfect Matches For You</h2>
            <div className="grid gap-4">
              {[].map((match: any) => (
                <div
                  key={match.id}
                  className="bg-gradient-to-r from-yellow-50 to-green-50 border-2 border-black rounded-lg p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-black">{match.assignments.title}</h3>
                        <span className="px-3 py-1 bg-[#FCFF52] border-2 border-black rounded-full text-sm font-bold">
                          {match.overall_match_score}% Match
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{match.assignments.company_name}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {match.matched_skills?.map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-green-100 border border-green-600 rounded text-xs font-semibold text-green-800"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                        {match.missing_skills?.map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-red-100 border border-red-600 rounded text-xs font-semibold text-red-800"
                          >
                            ✗ {skill}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">{match.ai_recommendation}</p>
                    </div>
                    <Link
                      href={`/dashboard/assignments/${match.assignment_id}`}
                      className="px-4 py-2 bg-[#35D07F] text-white font-bold rounded border-2 border-black hover:bg-[#2ab56f] transition"
                    >
                      View Assignment
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Assignments */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">All Open Assignments</h2>
          {/* Only show Post button for recruiters and admins */}
          {userRole && (userRole.isRecruiter || userRole.isAdmin) && (
            <Link
              href="/dashboard/assignments/post"
              className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Post an Assignment
            </Link>
          )}
        </div>

        <div className="grid gap-3">
          {assignments?.filter((a: any) => a.status === 'active').map((assignment: any) => (
            <div key={assignment.id} className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="text-base font-bold text-white flex-1 truncate">{assignment.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                      assignment.difficulty_level === 'beginner' ? 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/50' :
                      assignment.difficulty_level === 'intermediate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                      assignment.difficulty_level === 'advanced' ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
                      'bg-white/10 text-gray-300 border border-white/20'
                    }`}>
                      {assignment.difficulty_level?.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-2">{assignment.company_name}</p>

                  {/* Assignment Type & Details */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      {assignment.assignment_type === 'bug_fix' && '🐛 Bug Fix'}
                      {assignment.assignment_type === 'feature_implementation' && '✨ Feature'}
                      {assignment.assignment_type === 'code_review' && '👀 Code Review'}
                      {assignment.assignment_type === 'documentation' && '📝 Documentation'}
                      {assignment.assignment_type === 'testing' && '🧪 Testing'}
                    </span>
                    <span>⏱️ {assignment.estimated_hours}h</span>
                    <span className="font-bold text-[#3B82F6]">
                      💰 {assignment.reward_amount} CELO
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">{assignment.description}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {assignment.required_skills?.slice(0, 4).map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded text-xs font-semibold text-[#3B82F6]"
                      >
                        {skill}
                      </span>
                    ))}
                    {assignment.required_skills?.length > 4 && (
                      <span className="px-2 py-0.5 text-xs text-gray-400">+{assignment.required_skills.length - 4} more</span>
                    )}
                  </div>

                  {/* GitHub Link */}
                  {assignment.github_repo_url && (
                    <a
                      href={assignment.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#3B82F6] hover:text-[#60A5FA] transition flex items-center gap-1"
                    >
                      <span>📦</span> View Repository
                    </a>
                  )}
                </div>

                {/* Actions - Only show Submit button on main page */}
                <div className="flex flex-col gap-1.5 ml-2 flex-shrink-0">
                  <Link
                    href={`/dashboard/assignments/${assignment.id}/submit`}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-center whitespace-nowrap text-xs"
                  >
                    Submit Solution
                  </Link>
                  <span className="text-xs text-gray-500 text-center">
                    {assignment.current_submissions || 0}/{assignment.max_submissions}
                  </span>
                  {assignment.auto_verify && (
                    <span className="text-xs text-[#3B82F6] text-center font-semibold">
                      ⚡ Auto-verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!assignments || assignments.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-base">No assignments available yet</p>
            {/* Only show Post button for recruiters and admins */}
            {userRole && (userRole.isRecruiter || userRole.isAdmin) && (
              <Link
                href="/dashboard/assignments/post"
                className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition flex items-center gap-2 justify-center"
              >
                <Plus className="w-5 h-5" />
                Post the First Assignment
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
