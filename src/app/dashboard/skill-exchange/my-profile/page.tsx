'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MyProfilePage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills_offered: [] as string[],
    skills_wanted: [] as string[],
    interests: [] as string[],
    experience_level: 'intermediate',
    availability: ''
  })
  const [newSkillOffered, setNewSkillOffered] = useState('')
  const [newSkillWanted, setNewSkillWanted] = useState('')
  const [newInterest, setNewInterest] = useState('')

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('skill_exchange_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          skills_offered: data.skills_offered || [],
          skills_wanted: data.skills_wanted || [],
          interests: data.interests || [],
          experience_level: data.experience_level || 'intermediate',
          availability: data.availability || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('skill_exchange_profiles')
        .update({
          name: formData.name,
          bio: formData.bio,
          skills_offered: formData.skills_offered,
          skills_wanted: formData.skills_wanted,
          interests: formData.interests,
          experience_level: formData.experience_level,
          availability: formData.availability,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error

      alert('Profile updated successfully!')
      router.push('/dashboard/skill-exchange')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const addSkillOffered = () => {
    if (newSkillOffered.trim()) {
      setFormData({
        ...formData,
        skills_offered: [...formData.skills_offered, newSkillOffered.trim()]
      })
      setNewSkillOffered('')
    }
  }

  const removeSkillOffered = (index: number) => {
    setFormData({
      ...formData,
      skills_offered: formData.skills_offered.filter((_, i) => i !== index)
    })
  }

  const addSkillWanted = () => {
    if (newSkillWanted.trim()) {
      setFormData({
        ...formData,
        skills_wanted: [...formData.skills_wanted, newSkillWanted.trim()]
      })
      setNewSkillWanted('')
    }
  }

  const removeSkillWanted = (index: number) => {
    setFormData({
      ...formData,
      skills_wanted: formData.skills_wanted.filter((_, i) => i !== index)
    })
  }

  const addInterest = () => {
    if (newInterest.trim()) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()]
      })
      setNewInterest('')
    }
  }

  const removeInterest = (index: number) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((_, i) => i !== index)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
        <div className="text-2xl font-bold">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <header className="bg-white border-b-2 border-black shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black">✏️ My Skill Exchange Profile</h1>
              <p className="text-gray-600">Update your skills and preferences</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/skill-exchange')}
              className="px-4 py-2 border-2 border-black rounded font-bold hover:bg-gray-100 transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border-4 border-black rounded-lg p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Name */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black rounded-lg font-semibold"
              placeholder="Your name"
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black rounded-lg font-semibold"
              rows={4}
              placeholder="Tell others about yourself..."
            />
          </div>

          {/* Skills Offered */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">Skills I Can Teach</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkillOffered}
                onChange={(e) => setNewSkillOffered(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkillOffered()}
                className="flex-1 px-4 py-2 border-2 border-black rounded-lg font-semibold"
                placeholder="Add a skill..."
              />
              <button
                onClick={addSkillOffered}
                className="px-6 py-2 bg-[#35D07F] border-2 border-black rounded-lg font-bold text-white hover:bg-[#2ab56f] transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills_offered.map((skill, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-[#35D07F] border-2 border-black rounded-lg font-bold text-white flex items-center gap-2"
                >
                  {skill}
                  <button
                    onClick={() => removeSkillOffered(index)}
                    className="text-white hover:text-red-200"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Wanted */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">Skills I Want to Learn</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkillWanted}
                onChange={(e) => setNewSkillWanted(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkillWanted()}
                className="flex-1 px-4 py-2 border-2 border-black rounded-lg font-semibold"
                placeholder="Add a skill..."
              />
              <button
                onClick={addSkillWanted}
                className="px-6 py-2 bg-purple-500 border-2 border-black rounded-lg font-bold text-white hover:bg-purple-600 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills_wanted.map((skill, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-purple-500 border-2 border-black rounded-lg font-bold text-white flex items-center gap-2"
                >
                  {skill}
                  <button
                    onClick={() => removeSkillWanted(index)}
                    className="text-white hover:text-red-200"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">Interests</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                className="flex-1 px-4 py-2 border-2 border-black rounded-lg font-semibold"
                placeholder="Add an interest..."
              />
              <button
                onClick={addInterest}
                className="px-6 py-2 bg-[#FCFF52] border-2 border-black rounded-lg font-bold hover:bg-yellow-300 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-[#FCFF52] border-2 border-black rounded-lg font-bold flex items-center gap-2"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(index)}
                    className="hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">Experience Level</label>
            <select
              value={formData.experience_level}
              onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black rounded-lg font-semibold"
              aria-label="Experience Level"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {/* Availability */}
          <div className="mb-6">
            <label className="block text-lg font-bold mb-2">Availability</label>
            <input
              type="text"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              className="w-full px-4 py-3 border-2 border-black rounded-lg font-semibold"
              placeholder="e.g., Weekends, Evenings, Flexible"
            />
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-8 py-4 bg-[#35D07F] border-4 border-black rounded-lg font-black text-2xl text-white hover:bg-[#2ab56f] transition disabled:opacity-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
