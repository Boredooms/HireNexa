'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const SKILL_CATEGORIES = [
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'devops', label: 'DevOps' },
  { value: 'other', label: 'Other' },
]

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
]

export default function SubmitSkillPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    skill_name: '',
    skill_category: '',
    proficiency_level: '',
    description: '',
    github_repos: [''],
    portfolio_links: [''],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/skills/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          github_repos: formData.github_repos.filter(r => r.trim()),
          portfolio_links: formData.portfolio_links.filter(l => l.trim()),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Submission response:', data)
        alert('✅ Skill submitted successfully! Please complete payment to proceed.')
        // The API returns submission directly in the data object
        const submissionId = data.submission?.id || data.id
        if (submissionId) {
          router.push(`/dashboard/skills/payment/${submissionId}`)
        } else {
          console.error('No submission ID in response:', data)
          alert('Submission created but ID not found. Please check your skills page.')
          router.push('/dashboard/skills')
        }
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('Error submitting skill:', error)
      alert('❌ Failed to submit skill')
    } finally {
      setLoading(false)
    }
  }

  const addField = (field: 'github_repos' | 'portfolio_links') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }))
  }

  const updateField = (field: 'github_repos' | 'portfolio_links', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard/skills" className="text-gray-400 hover:text-gray-300 mb-2 inline-flex items-center gap-1 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Skills
          </Link>
          <h1 className="text-2xl font-bold text-white">Submit Skill for Verification</h1>
          <p className="text-gray-400 text-sm mt-1">Get your skills verified by expert peer reviewers</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Cost Info */}
        <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg p-5 mb-6">
          <h3 className="text-base font-bold text-[#3B82F6] mb-2 flex items-center gap-2">💰 Verification Cost</h3>
          <p className="text-gray-300 mb-2 text-sm">
            <strong>0.01 CELO</strong> (Celo Sepolia testnet - FREE testnet tokens!)
          </p>
          <p className="text-xs text-gray-400 mb-2">
            Your skill will be reviewed by an approved peer reviewer within 48 hours.
          </p>
          <p className="text-xs text-gray-400">
            💡 Get free Celo Sepolia CELO from: <a href="https://faucet.celo.org" target="_blank" className="text-[#3B82F6] hover:underline">faucet.celo.org</a>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6">
          {/* Skill Name */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-white mb-2">
              Skill Name *
            </label>
            <input
              type="text"
              required
              value={formData.skill_name}
              onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
              placeholder="e.g., React.js, Python, Solidity"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition"
            />
          </div>

          {/* Category */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-white mb-2">
              Category *
            </label>
            <select
              required
              value={formData.skill_category}
              onChange={(e) => setFormData({ ...formData, skill_category: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition"
            >
              <option value="" className="bg-gray-900">Select category</option>
              {SKILL_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value} className="bg-gray-900">{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Proficiency Level */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-white mb-2">
              Your Proficiency Level *
            </label>
            <select
              required
              value={formData.proficiency_level}
              onChange={(e) => setFormData({ ...formData, proficiency_level: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition"
            >
              <option value="" className="bg-gray-900">Select level</option>
              {PROFICIENCY_LEVELS.map(level => (
                <option key={level.value} value={level.value} className="bg-gray-900">{level.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-white mb-2">
              Description * (min 100 characters)
            </label>
            <textarea
              required
              minLength={100}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your experience with this skill, projects you've worked on, and what makes you proficient..."
              rows={5}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.description.length}/100 characters
            </p>
          </div>

          {/* GitHub Repos */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-white mb-2">
              GitHub Repositories (Evidence)
            </label>
            {formData.github_repos.map((repo, index) => (
              <input
                key={index}
                type="url"
                value={repo}
                onChange={(e) => updateField('github_repos', index, e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition mb-2"
              />
            ))}
            <button
              type="button"
              onClick={() => addField('github_repos')}
              className="text-[#3B82F6] hover:text-[#60A5FA] text-sm font-bold transition"
            >
              + Add another repository
            </button>
          </div>

          {/* Portfolio Links */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-white mb-2">
              Portfolio Links
            </label>
            {formData.portfolio_links.map((link, index) => (
              <input
                key={index}
                type="url"
                value={link}
                onChange={(e) => updateField('portfolio_links', index, e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition mb-2"
              />
            ))}
            <button
              type="button"
              onClick={() => addField('portfolio_links')}
              className="text-[#3B82F6] hover:text-[#60A5FA] text-sm font-bold transition"
            >
              + Add another link
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit for Verification →'}
          </button>
        </form>
      </main>
    </div>
  )
}
