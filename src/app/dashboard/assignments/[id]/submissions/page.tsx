import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { SubmissionActions } from '@/components/SubmissionActions'
import DeletePendingSubmissionButton from '@/components/DeletePendingSubmissionButton'

export default async function AssignmentSubmissionsPage({
  params,
}: {
  params: { id: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get assignment details
  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!assignment) {
    return <div>Assignment not found</div>
  }

  // Verify user is the employer
  if (assignment.employer_id !== userId) {
    redirect('/dashboard/recruiter')
  }

  // Get all submissions for this assignment
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('*, users:candidate_id(full_name, email, avatar_url, github_username)')
    .eq('assignment_id', params.id)
    .order('submitted_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <header className="bg-white shadow border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/recruiter"
              className="text-gray-600 hover:text-black"
            >
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-black">{assignment.title}</h1>
              <p className="text-gray-600">
                {submissions?.length || 0} submission(s) • {assignment.reward_amount} {assignment.reward_currency} reward
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Assignment Details */}
        <div className="bg-white border-2 border-black rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-4">Assignment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-semibold">{assignment.assignment_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Difficulty</p>
              <p className="font-semibold">{assignment.difficulty_level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Hours</p>
              <p className="font-semibold">{assignment.estimated_hours}h</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Max Submissions</p>
              <p className="font-semibold">
                {assignment.current_submissions} / {assignment.max_submissions}
              </p>
            </div>
          </div>
          {assignment.github_repo_url && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Repository</p>
              <a
                href={assignment.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {assignment.github_repo_url}
              </a>
            </div>
          )}
        </div>

        {/* Submissions */}
        <div>
          <h2 className="text-xl font-bold text-black mb-4">Submissions</h2>
          {submissions && submissions.length > 0 ? (
            <div className="grid gap-4">
              {submissions.map((submission: any) => (
                <div
                  key={submission.id}
                  className="bg-white border-2 border-black rounded-lg p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Candidate Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-black flex items-center justify-center text-lg font-bold">
                          {submission.users?.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <h3 className="font-bold text-black">
                            {submission.users?.full_name || 'Anonymous'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            @{submission.users?.github_username || 'unknown'}
                          </p>
                        </div>
                      </div>

                      {/* Submission Details */}
                      <div className="space-y-2 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">GitHub PR</p>
                          <a
                            href={submission.github_pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {submission.github_pr_url}
                          </a>
                        </div>
                        {submission.submission_notes && (
                          <div>
                            <p className="text-sm text-gray-600">Notes</p>
                            <p className="text-gray-800">{submission.submission_notes}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Submitted</p>
                          <p className="text-gray-800">
                            {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded border-2 font-semibold text-sm ${
                            submission.review_status === 'approved'
                              ? 'bg-green-100 border-green-600 text-green-800'
                              : submission.review_status === 'rejected'
                              ? 'bg-red-100 border-red-600 text-red-800'
                              : submission.review_status === 'reviewing'
                              ? 'bg-blue-100 border-blue-600 text-blue-800'
                              : 'bg-yellow-100 border-yellow-600 text-yellow-800'
                          }`}
                        >
                          {submission.review_status}
                        </span>
                        {submission.ai_verification_score && (
                          <span className="px-3 py-1 bg-purple-100 border-2 border-purple-600 text-purple-800 rounded font-semibold text-sm">
                            AI Score: {submission.ai_verification_score}%
                          </span>
                        )}
                        {submission.github_checks_passed && (
                          <span className="px-3 py-1 bg-green-100 border-2 border-green-600 text-green-800 rounded font-semibold text-sm">
                            ✓ GitHub Checks Passed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {submission.review_status === 'pending' && submission.blockchain_submission_id && (
                      <SubmissionActions
                        submissionId={submission.id}
                        blockchainSubmissionId={submission.blockchain_submission_id}
                        assignmentId={assignment.id}
                        candidateId={submission.candidate_id}
                        candidateName={submission.users?.full_name || 'Unknown'}
                      />
                    )}
                    {submission.review_status === 'pending' && !submission.blockchain_submission_id && (
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-orange-600 font-semibold">
                          ⚠️ Blockchain submission pending
                        </div>
                        <DeletePendingSubmissionButton 
                          submissionId={submission.id}
                          hasBlockchainId={!!submission.blockchain_submission_id}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border-2 border-black rounded-lg">
              <p className="text-gray-600 text-lg mb-4">No submissions yet</p>
              <p className="text-gray-500">
                Share this assignment with developers to get submissions!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
