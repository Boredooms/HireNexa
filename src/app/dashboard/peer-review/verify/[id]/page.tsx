'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
]

export default function VerifySkillPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const params = useParams()
  const submissionId = params.id as string

  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [formData, setFormData] = useState({
    verified: true,
    confidence_score: 80,
    proficiency_assessment: '',
    review_notes: '',
    strengths: '',
    areas_for_improvement: '',
    evidence_quality_score: 8,
  })

  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const fetchSubmission = async () => {
      const { data, error } = await supabase
        .from('skill_submission_requests')
        .select(`
          *,
          users:user_id (
            full_name,
            email,
            github_username
          )
        `)
        .eq('id', submissionId)
        .single()

      if (error || !data) {
        alert('Submission not found')
        router.push('/dashboard/peer-review')
        return
      }

      setSubmission(data)
      setLoading(false)
    }

    fetchSubmission()
  }, [userId, submissionId, router, supabase])

  const handleClaim = async () => {
    try {
      const response = await fetch('/api/skills/claim-for-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })

      const data = await response.json()

      if (response.ok) {
        setClaimed(true)
        alert('✅ Skill claimed successfully! You can now review it.')
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('Error claiming skill:', error)
      alert('❌ Failed to claim skill')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/skills/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Review submitted successfully! You will receive 5 cUSD shortly.')
        router.push('/dashboard/peer-review')
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('❌ Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
        <div className="text-xl font-bold">Loading...</div>
      </div>
    )
  }

  const isAssignedToMe = submission.assigned_reviewer_id === userId
  const canReview = submission.status === 'under_review' && isAssignedToMe

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <header className="bg-white shadow border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard/peer-review" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Peer Review
          </Link>
          <h1 className="text-2xl font-bold text-black">Verify Skill</h1>
          <p className="text-gray-600">Review evidence and provide feedback</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Skill Details */}
          <div className="space-y-6">
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Skill Information</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Skill Name</div>
                  <div className="text-lg font-bold text-black">{submission.skill_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Category</div>
                  <div className="font-semibold capitalize">{submission.skill_category}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Claimed Proficiency</div>
                  <div className="font-semibold capitalize">{submission.proficiency_level}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Submitted By</div>
                  <div className="font-semibold">{submission.users?.full_name || submission.users?.email}</div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{submission.description}</p>
            </div>

            {/* Evidence */}
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Evidence</h2>
              
              {submission.github_repos && submission.github_repos.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-bold text-black mb-2">GitHub Repositories</div>
                  {submission.github_repos.map((repo: string, index: number) => (
                    <a
                      key={index}
                      href={repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline mb-1"
                    >
                      {repo}
                    </a>
                  ))}
                </div>
              )}

              {submission.portfolio_links && submission.portfolio_links.length > 0 && (
                <div>
                  <div className="text-sm font-bold text-black mb-2">Portfolio Links</div>
                  {submission.portfolio_links.map((link: string, index: number) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline mb-1"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Claim Button */}
            {!isAssignedToMe && submission.status === 'awaiting_review' && (
              <button
                onClick={handleClaim}
                disabled={claimed}
                className="w-full px-6 py-4 bg-[#35D07F] text-white font-bold rounded border-2 border-black hover:bg-green-600 transition disabled:opacity-50"
              >
                {claimed ? '✅ Claimed!' : '🎯 Claim This Skill'}
              </button>
            )}
          </div>

          {/* Review Form */}
          {canReview && (
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Submit Review</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Verification Decision */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Verification Decision *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.verified}
                        onChange={() => setFormData({ ...formData, verified: true })}
                        className="mr-2"
                      />
                      <span className="font-semibold text-green-600">✓ Verify</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!formData.verified}
                        onChange={() => setFormData({ ...formData, verified: false })}
                        className="mr-2"
                      />
                      <span className="font-semibold text-red-600">✗ Reject</span>
                    </label>
                  </div>
                </div>

                {/* Confidence Score */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Confidence Score: {formData.confidence_score}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.confidence_score}
                    onChange={(e) => setFormData({ ...formData, confidence_score: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Proficiency Assessment */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Assessed Proficiency Level
                  </label>
                  <select
                    value={formData.proficiency_assessment}
                    onChange={(e) => setFormData({ ...formData, proficiency_assessment: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black rounded"
                  >
                    <option value="">Select level</option>
                    {PROFICIENCY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                {/* Review Notes */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Review Notes * (min 50 characters)
                  </label>
                  <textarea
                    required
                    minLength={50}
                    value={formData.review_notes}
                    onChange={(e) => setFormData({ ...formData, review_notes: e.target.value })}
                    placeholder="Provide detailed feedback on the skill evidence..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-black rounded"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.review_notes.length}/50 characters
                  </p>
                </div>

                {/* Strengths */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Strengths
                  </label>
                  <textarea
                    value={formData.strengths}
                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                    placeholder="What are the strong points of this skill demonstration?"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-black rounded"
                  />
                </div>

                {/* Areas for Improvement */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Areas for Improvement
                  </label>
                  <textarea
                    value={formData.areas_for_improvement}
                    onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                    placeholder="What could be improved?"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-black rounded"
                  />
                </div>

                {/* Evidence Quality */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Evidence Quality: {formData.evidence_quality_score}/10
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.evidence_quality_score}
                    onChange={(e) => setFormData({ ...formData, evidence_quality_score: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Submit */}
                <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-700 mb-1">You will earn:</div>
                  <div className="text-2xl font-bold text-green-600">5 cUSD</div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-4 bg-[#FCFF52] text-black font-bold rounded border-2 border-black hover:bg-yellow-300 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting Review...' : '✓ Submit Review & Earn 5 cUSD'}
                </button>
              </form>
            </div>
          )}

          {!canReview && isAssignedToMe && (
            <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-bold text-black mb-2">Review In Progress</h3>
              <p className="text-gray-600">
                This skill is currently being reviewed.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
