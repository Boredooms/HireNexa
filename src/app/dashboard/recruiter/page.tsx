import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DeleteAssignmentButton } from '@/components/DeleteAssignmentButton'
import { DashboardSidebar } from '@/components/DashboardNav'
import { Briefcase, Users, CheckCircle, Search } from 'lucide-react'

export default async function RecruiterDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createClient()

  // Check if user is recruiter or admin
  const { data: user } = await supabase
    .from('users')
    .select('role, is_recruiter, is_admin')
    .eq('id', userId)
    .single()

  const isRecruiter = user?.is_recruiter === true || user?.role === 'recruiter'
  const isAdmin = user?.is_admin === true || user?.role === 'admin'

  // Admins can always access (they have all permissions)
  // Regular users must be recruiters or apply first
  if (!isAdmin && !isRecruiter) {
    redirect('/dashboard/recruiter/apply')
  }

  // Get employer's assignments
  const { data: jobs } = await supabase
    .from('assignments')
    .select('*')
    .eq('employer_id', userId)
    .order('created_at', { ascending: false })

  // Get all applications for employer's assignments
  const jobIds = jobs?.map((j) => j.id) || []
  const { data: applications } = await supabase
    .from('applications')
    .select('*, assignments(title, company_name)')
    .in('assignment_id', jobIds)
    .order('ai_match_score', { ascending: false })

  // Get candidates with verified skills
  const { data: topCandidates } = await supabase
    .from('users')
    .select('id, full_name, bio, avatar_url, github_username, career_level')
    .not('wallet_address', 'is', null)
    .limit(10)

  // Get skills for each candidate
  const candidateIds = topCandidates?.map((c) => c.id) || []
  const { data: candidateSkills } = await supabase
    .from('skills')
    .select('user_id, skill_name, confidence_score, ai_verified')
    .in('user_id', candidateIds)
    .eq('revoked', false)
    .gte('confidence_score', 70)

  // Group skills by candidate
  const skillsByCandidate = candidateSkills?.reduce((acc, skill) => {
    if (!acc[skill.user_id]) acc[skill.user_id] = []
    acc[skill.user_id].push(skill)
    return acc
  }, {} as Record<string, any[]>)

  // Calculate stats
  const totalApplications = applications?.length || 0
  const pendingReview = applications?.filter((a) => a.status === 'pending').length || 0
  const shortlisted = applications?.filter((a) => a.status === 'shortlisted').length || 0
  const hired = applications?.filter((a) => a.status === 'accepted').length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white">Recruiter Dashboard</h1>
          <p className="text-gray-400">Find and hire verified talent</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3B82F6]">{jobs?.length || 0}</div>
                <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Active Jobs</div>
              </div>
              <Briefcase className="w-8 h-8 text-[#3B82F6]/50 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3B82F6]">{totalApplications}</div>
                <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Total Applications</div>
              </div>
              <Users className="w-8 h-8 text-[#3B82F6]/50 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3B82F6]">{shortlisted}</div>
                <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Shortlisted</div>
              </div>
              <CheckCircle className="w-8 h-8 text-[#3B82F6]/50 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#3B82F6]">{hired}</div>
                <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Hired</div>
              </div>
              <CheckCircle className="w-8 h-8 text-[#3B82F6]/50 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <Link
            href="/dashboard/assignments/post"
            className="px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm"
          >
            + Post New Assignment
          </Link>
          <Link
            href="/dashboard/recruiter/candidates"
            className="px-4 py-2.5 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition text-sm flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search Candidates
          </Link>
        </div>

        {/* Pending Applications */}
        {pendingReview > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">
              ⏳ Pending Review ({pendingReview})
            </h2>
            <div className="grid gap-3">
              {applications
                ?.filter((app) => app.status === 'pending')
                .slice(0, 5)
                .map((app) => (
                  <div
                    key={app.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-bold text-white">
                            Application for {app.assignments?.title}
                          </h3>
                          <span className="px-2 py-1 bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/50 rounded-full text-xs font-bold">
                            {app.ai_match_score}% Match
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mb-2">
                          Applied {new Date(app.applied_at).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {app.ai_match_reasons?.map((reason: string) => (
                            <span
                              key={reason}
                              className="text-xs text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded"
                            >
                              • {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/recruiter/applications/${app.id}`}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-xs whitespace-nowrap"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Top Candidates with Verified Skills */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">
            ⭐ Top Candidates with Verified Skills
          </h2>
          <div className="grid gap-3">
            {topCandidates?.slice(0, 5).map((candidate) => {
              const skills = skillsByCandidate?.[candidate.id] || []
              const verifiedSkills = skills.filter((s) => s.ai_verified)
              const avgConfidence =
                skills.length > 0
                  ? Math.round(
                      skills.reduce((sum, s) => sum + s.confidence_score, 0) / skills.length
                    )
                  : 0

              return (
                <div
                  key={candidate.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-full border border-[#3B82F6]/50 flex items-center justify-center text-lg font-bold text-[#3B82F6] flex-shrink-0">
                      {candidate.full_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white">
                        {candidate.full_name || 'Anonymous'}
                      </h3>
                      <p className="text-gray-400 text-xs mb-1.5">
                        {candidate.career_level || 'Developer'} • {candidate.github_username}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill.skill_name}
                            className={`px-1.5 py-0.5 text-xs font-semibold rounded border ${
                              skill.ai_verified
                                ? 'bg-[#3B82F6]/20 border-[#3B82F6]/50 text-[#3B82F6]'
                                : 'bg-white/5 border-white/10 text-gray-300'
                            }`}
                          >
                            {skill.ai_verified && '✓ '}
                            {skill.skill_name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className="text-xl font-bold text-[#3B82F6]">{avgConfidence}%</div>
                      <div className="text-xs text-gray-400">Confidence</div>
                      <div className="text-xs text-[#3B82F6] mt-0.5">
                        ✓ {verifiedSkills.length} verified
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/recruiter/candidates/${candidate.id}`}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-xs whitespace-nowrap flex-shrink-0"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Your Job Postings */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Your Job Postings</h2>
          {jobs && jobs.length > 0 ? (
            <div className="grid gap-3">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white mb-1">{job.title}</h3>
                      <p className="text-gray-400 text-xs mb-2">
                        Posted {new Date(job.created_at).toLocaleDateString()} •{' '}
                        {job.applications_count} applications
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            job.status === 'active'
                              ? 'bg-[#3B82F6]/20 border border-[#3B82F6]/50 text-[#3B82F6]'
                              : 'bg-white/5 border border-white/10 text-gray-400'
                          }`}
                        >
                          {job.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          💰 ${job.salary_min?.toLocaleString()} - $
                          {job.salary_max?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        href={`/dashboard/assignments/${job.id}/submissions`}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-xs whitespace-nowrap"
                      >
                        View Submissions ({job.applications_count})
                      </Link>
                      <DeleteAssignmentButton assignmentId={job.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
              <p className="text-gray-400 text-base mb-4">No assignments posted yet</p>
              <Link
                href="/dashboard/assignments/post"
                className="inline-block px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm"
              >
                Post Your First Assignment
              </Link>
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  )
}
