'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const EXPERTISE_OPTIONS = [
  'React',
  'Node.js',
  'Python',
  'TypeScript',
  'Solidity',
  'Web3',
  'DevOps',
  'Database Design',
  'System Architecture',
  'Mobile Development',
  'Machine Learning',
  'Cloud Computing',
  'Security',
  'Performance Optimization',
  'Testing',
  'UI/UX Design',
]

export default function PeerReviewerApplicationPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    expertise_areas: [] as string[],
    years_experience: '',
    github_profile: '',
    linkedin_profile: '',
    portfolio_url: '',
    why_verify_skills: '',
    previous_verification_experience: '',
  })

  const handleExpertiseToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      expertise_areas: prev.expertise_areas.includes(skill)
        ? prev.expertise_areas.filter(s => s !== skill)
        : [...prev.expertise_areas, skill]
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (formData.expertise_areas.length === 0) {
        throw new Error('Please select at least one expertise area')
      }

      if (!formData.years_experience || !formData.why_verify_skills) {
        throw new Error('Please fill in all required fields')
      }

      if (formData.why_verify_skills.length < 50) {
        throw new Error('Please provide at least 50 characters for "Why verify skills"')
      }

      // Submit application
      const response = await fetch('/api/peer-reviewer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit application')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/peer-review')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Please sign in to apply</p>
          <Link href="/sign-in" className="px-6 py-3 bg-[#FCFF52] text-black font-bold rounded border-2 border-black">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <header className="bg-white shadow border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/dashboard/peer-review" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Peer Review
          </Link>
          <h1 className="text-3xl font-bold text-black">Become a Skill Verifier</h1>
          <p className="text-gray-600 mt-2">Verify skills and earn 5 cUSD per verification</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border-2 border-black rounded-lg p-8">
          {success ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-black mb-2">Application Submitted!</h2>
              <p className="text-gray-600 mb-4">
                Your peer reviewer application has been submitted for review.
              </p>
              <p className="text-gray-600 mb-4">
                Upon approval, you'll need to deposit 5 cUSD to start verifying skills.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to peer review dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg">
                  <p className="text-red-700 font-bold">{error}</p>
                </div>
              )}

              {/* Expertise */}
              <div>
                <h2 className="text-xl font-bold text-black mb-4">Your Expertise *</h2>
                <p className="text-sm text-gray-600 mb-4">Select all areas where you can verify skills</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {EXPERTISE_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleExpertiseToggle(skill)}
                      className={`px-4 py-2 rounded border-2 border-black font-bold transition ${
                        formData.expertise_areas.includes(skill)
                          ? 'bg-[#35D07F] text-white'
                          : 'bg-white text-black hover:bg-gray-100'
                      }`}
                    >
                      {formData.expertise_areas.includes(skill) ? '✓ ' : ''}{skill}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Selected: {formData.expertise_areas.length}
                </p>
              </div>

              {/* Experience */}
              <div>
                <h2 className="text-xl font-bold text-black mb-4">Your Experience</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Years of Experience in Selected Areas *
                    </label>
                    <input
                      type="number"
                      name="years_experience"
                      value={formData.years_experience}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      min="0"
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      GitHub Profile
                    </label>
                    <input
                      type="url"
                      name="github_profile"
                      value={formData.github_profile}
                      onChange={handleChange}
                      placeholder="https://github.com/yourprofile"
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      name="linkedin_profile"
                      value={formData.linkedin_profile}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      name="portfolio_url"
                      value={formData.portfolio_url}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Motivation */}
              <div>
                <h2 className="text-xl font-bold text-black mb-4">Motivation</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Why do you want to verify skills? * (min 50 chars)
                    </label>
                    <textarea
                      name="why_verify_skills"
                      value={formData.why_verify_skills}
                      onChange={handleChange}
                      placeholder="Tell us why you're interested in verifying skills on Hirenexa..."
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-mono"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {formData.why_verify_skills.length}/50 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Previous Verification Experience
                    </label>
                    <textarea
                      name="previous_verification_experience"
                      value={formData.previous_verification_experience}
                      onChange={handleChange}
                      placeholder="Have you verified skills before? Tell us about it..."
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-[#FCFF52] border-2 border-black rounded-lg p-4 space-y-2">
                <p className="text-sm font-bold text-black">
                  ℹ️ Upon approval, you'll deposit 5 cUSD to start verifying skills.
                </p>
                <p className="text-sm font-bold text-black">
                  💰 You earn 5 cUSD per successful verification (after 10% platform fee).
                </p>
                <p className="text-sm font-bold text-black">
                  ⭐ Build your reputation and unlock higher-value verifications.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-[#35D07F] text-white font-bold rounded border-2 border-black hover:bg-[#2ab56f] disabled:opacity-50 transition"
                >
                  {loading ? 'Submitting...' : '✅ Submit Application'}
                </button>
                <Link
                  href="/dashboard/peer-review"
                  className="px-6 py-3 bg-gray-300 text-black font-bold rounded border-2 border-black hover:bg-gray-400 transition"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
