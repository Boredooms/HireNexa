'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function CreateAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    secretKey: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/admin')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0f0f1e] to-black p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block mb-4 p-3 bg-[#3B82F6]/20 rounded-lg">
            <Shield className="w-8 h-8 text-[#3B82F6]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Create Admin Account
          </h1>
          <p className="text-gray-400 text-sm">
            Requires secret admin key
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-[#3B82F6] mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white mb-2">Admin Created!</h2>
              <p className="text-gray-300 mb-2 text-sm">
                The user has been granted admin privileges.
              </p>
              <p className="text-xs text-gray-500">
                Redirecting to admin dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300 font-bold text-sm">{error}</p>
                </div>
              )}

              {/* Warning */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-300 text-xs font-bold">
                  WARNING: This action grants full platform access. Only use the official admin secret key.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                  User Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:bg-white/15 transition text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email of the user to make admin (must already exist)
                </p>
              </div>

              {/* Secret Key */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                  Admin Secret Key *
                </label>
                <input
                  type="password"
                  name="secretKey"
                  value={formData.secretKey}
                  onChange={handleChange}
                  placeholder="Enter secret admin key"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]/50 focus:bg-white/15 transition text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Contact platform owner for the secret key
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 disabled:opacity-50 transition text-sm"
              >
                {loading ? 'Creating Admin...' : '🛡️ Create Admin Account'}
              </button>

              {/* Back Link */}
              <Link
                href="/"
                className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to home
              </Link>
            </form>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This page is protected by server-side validation.
            <br />
            Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  )
}
