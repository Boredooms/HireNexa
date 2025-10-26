'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

export default function RegisterVerifierPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    expertise_areas: '',
    years_experience: '',
    github_profile: '',
    linkedin_profile: '',
    why_verify: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/verifier/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expertise_areas: formData.expertise_areas.split(',').map((s) => s.trim()),
          years_experience: parseInt(formData.years_experience) || 0,
        }),
      })

      if (response.ok) {
        alert('Registration submitted! You will be notified once approved.')
        router.push('/dashboard/peer-review')
      } else {
        alert('Failed to register')
      }
    } catch (error) {
      console.error('Error registering:', error)
      alert('Error registering')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      <header className="bg-white shadow border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-black">Register as Skill Verifier</h1>
          <p className="text-gray-600">Earn 5 cUSD per verification</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white border-2 border-black rounded-lg p-8">
          {/* Expertise Areas */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">
              Expertise Areas * (comma-separated)
            </label>
            <input
              type="text"
              required
              value={formData.expertise_areas}
              onChange={(e) => setFormData({ ...formData, expertise_areas: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="React, TypeScript, Node.js, Python"
            />
          </div>

          {/* Years of Experience */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">
              Years of Experience *
            </label>
            <input
              type="number"
              required
              value={formData.years_experience}
              onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="5"
            />
          </div>

          {/* GitHub Profile */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">GitHub Profile *</label>
            <input
              type="url"
              required
              value={formData.github_profile}
              onChange={(e) => setFormData({ ...formData, github_profile: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="https://github.com/yourusername"
            />
          </div>

          {/* LinkedIn Profile */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">LinkedIn Profile</label>
            <input
              type="url"
              value={formData.linkedin_profile}
              onChange={(e) => setFormData({ ...formData, linkedin_profile: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded"
              placeholder="https://linkedin.com/in/yourusername"
            />
          </div>

          {/* Why Verify */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-black mb-2">
              Why do you want to be a verifier? *
            </label>
            <textarea
              required
              value={formData.why_verify}
              onChange={(e) => setFormData({ ...formData, why_verify: e.target.value })}
              className="w-full px-4 py-2 border-2 border-black rounded h-32"
              placeholder="Tell us about your experience and why you'd be a good verifier..."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-black mb-2">What You'll Get:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Earn 5 cUSD per skill verification</li>
              <li>✓ Build your reputation score</li>
              <li>✓ Help maintain platform quality</li>
              <li>✓ Access to exclusive verifier community</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#FCFF52] text-black font-bold rounded border-2 border-black hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-white text-black font-bold rounded border-2 border-black hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
