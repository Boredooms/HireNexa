'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function RecruiterApplicationPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    company_name: '',
    company_website: '',
    company_description: '',
    years_hiring_experience: '',
    linkedin_profile: '',
    why_join_platform: '',
    expected_monthly_postings: '',
  })

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
      if (!formData.company_name || !formData.company_description || !formData.why_join_platform) {
        throw new Error('Please fill in all required fields')
      }

      if (formData.why_join_platform.length < 50) {
        throw new Error('Please provide at least 50 characters for "Why join Hirenexa"')
      }

      // Submit application
      const response = await fetch('/api/recruiter/apply', {
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
        router.push('/dashboard/recruiter')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl font-bold text-white mb-4">Please sign in to apply</p>
          <Link href="/sign-in" className="inline-block px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard" className="flex items-center gap-2 text-[#3B82F6] hover:text-[#60A5FA] mb-4 transition text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Apply as Recruiter</h1>
          <p className="text-gray-400 mt-2">Post assignments and find verified talent</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-[#3B82F6] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
              <p className="text-gray-300 mb-2">
                Your recruiter application has been submitted for review.
              </p>
              <p className="text-gray-400 mb-4 text-sm">
                Our admin team will review your application within 24-48 hours.
              </p>
              <p className="text-xs text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 font-bold text-sm">{error}</p>
                </div>
              )}

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Company Information</h3>
                <div className="space-y-3 bg-white/5 rounded-lg p-4 border border-white/10">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="e.g., Acme Corp"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:bg-white/15 transition text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Company Website
                    </label>
                    <input
                      type="url"
                      name="company_website"
                      value={formData.company_website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:bg-white/15 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Company Description *
                    </label>
                    <textarea
                      name="company_description"
                      value={formData.company_description}
                      onChange={handleChange}
                      placeholder="Tell us about your company..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:bg-white/15 transition text-sm resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Your Experience</h3>
                <div className="space-y-3 bg-white/5 rounded-lg p-4 border border-white/10">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Years of Hiring Experience
                    </label>
                    <input
                      type="number"
                      name="years_hiring_experience"
                      value={formData.years_hiring_experience}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      min="0"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:bg-white/15 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      name="linkedin_profile"
                      value={formData.linkedin_profile}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:bg-white/15 transition text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Platform Details */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Platform Details</h3>
                <div className="space-y-3 bg-white/5 rounded-lg p-4 border border-white/10">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Why do you want to join Hirenexa? * (min 50 chars)
                    </label>
                    <textarea
                      name="why_join_platform"
                      value={formData.why_join_platform}
                      onChange={handleChange}
                      placeholder="Tell us why you're interested in posting assignments on Hirenexa..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:bg-white/15 transition text-sm resize-none"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      {formData.why_join_platform.length}/50 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Expected Monthly Assignments
                    </label>
                    <input
                      type="number"
                      name="expected_monthly_postings"
                      value={formData.expected_monthly_postings}
                      onChange={handleChange}
                      placeholder="e.g., 10"
                      min="0"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:bg-white/15 transition text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs font-bold text-blue-300">
                  ℹ️ After approval, you'll be able to post assignments and find verified talent on Hirenexa.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 disabled:opacity-50 transition text-sm"
                >
                  {loading ? 'Submitting...' : '✅ Submit Application'}
                </button>
                <Link
                  href="/dashboard"
                  className="px-4 py-2.5 bg-white/10 border border-white/20 text-gray-300 font-bold rounded-lg hover:bg-white/20 transition text-sm"
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
