import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Code2, Briefcase, Shield, Check } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function SwitchRolePage() {
  const { userId } = await auth()
  
  // Get user role
  let isRecruiter = false
  let isAdmin = false
  
  if (userId) {
    const { data: user } = await supabase
      .from('users')
      .select('role, is_recruiter, is_admin')
      .eq('id', userId)
      .single()
    
    isRecruiter = user?.is_recruiter === true || user?.role === 'recruiter'
    isAdmin = user?.is_admin === true || user?.role === 'admin'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0f0f1e] to-black p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Switch to <span className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">Different View</span>
          </h1>
          <p className="text-gray-400">
            {userId ? 'Choose which dashboard to view' : 'Choose your role to get started'}
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto mb-6">
          {/* Developer Card */}
          <Link
            href="/dashboard"
            className="group block p-5 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/10 hover:border-[#3B82F6]/50 transition-all duration-300"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-block mb-4 p-3 bg-[#3B82F6]/20 rounded-lg group-hover:scale-110 transition-transform">
                <Code2 className="w-8 h-8 text-[#3B82F6]" />
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-white mb-2">
                Developer
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-4 text-sm">
                Build portfolio, earn CELO, and showcase skills.
              </p>

              {/* Features */}
              <ul className="text-xs text-gray-300 space-y-1 mb-4 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Portfolio NFT</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Complete assignments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Skill exchange</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Earn certificates</span>
                </li>
              </ul>

              {/* Button */}
              <button className="w-full px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm">
                View Developer Dashboard →
              </button>
            </div>
          </Link>

          {/* Recruiter Card */}
          <Link
            href="/dashboard/recruiter"
            className="group block p-5 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/10 hover:border-[#3B82F6]/50 transition-all duration-300"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-block mb-4 p-3 bg-[#3B82F6]/20 rounded-lg group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8 text-[#3B82F6]" />
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-white mb-2">
                Recruiter
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-4 text-sm">
                Post assignments and hire verified developers.
              </p>

              {/* Features */}
              <ul className="text-xs text-gray-300 space-y-1 mb-4 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Post assignments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Review submissions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Pay with CELO</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Hire talent</span>
                </li>
              </ul>

              {/* Button */}
              <button className="w-full px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm">
                View Recruiter Dashboard →
              </button>
            </div>
          </Link>

          {/* Admin Card */}
          <Link
            href="/dashboard/admin"
            className="group block p-5 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/10 hover:border-[#3B82F6]/50 transition-all duration-300"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-block mb-4 p-3 bg-[#3B82F6]/20 rounded-lg group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-[#3B82F6]" />
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-white mb-2">
                Admin
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-4 text-sm">
                Manage platform and approve applications.
              </p>

              {/* Features */}
              <ul className="text-xs text-gray-300 space-y-1 mb-4 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Approve recruiters</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Approve verifiers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Platform analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                  <span>Full access</span>
                </li>
              </ul>

              {/* Button */}
              <button className="w-full px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-sm">
                View Admin Dashboard →
              </button>
            </div>
          </Link>
        </div>

        {/* Info Boxes */}
        {!userId && (
          <div className="max-w-6xl mx-auto mb-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <p className="text-center text-gray-300 text-sm">
                <strong>Note:</strong> You need to sign in first to access dashboards.{' '}
                <Link href="/sign-in" className="font-bold text-[#3B82F6] hover:text-[#60A5FA] transition">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        )}
        
        {/* Admin Creation Info */}
        {userId && !isAdmin && (
          <div className="max-w-6xl mx-auto mb-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <p className="text-center text-gray-300 text-sm">
                <strong>🛡️ Want to become an Admin?</strong>
                <br />
                <span className="text-xs">If you have the admin secret key, you can create an admin account.</span>
                <br />
                <Link href="/admin/create" className="inline-block mt-2 px-4 py-1 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition text-xs">
                  Create Admin Account →
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Back to home */}
        <div className="text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-300 transition">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
