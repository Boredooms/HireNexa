import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SignUpPage() {
  // Redirect if already logged in
  const { userId } = await auth()
  if (userId) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      <div className="w-full max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">
            Join <span className="text-[#3B82F6]">HireNexa</span>
          </h1>
          <p className="text-xl text-gray-400">
            Choose your role to get started
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Developer Card */}
          <Link
            href="/sign-up/user"
            className="group block p-8 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg hover:shadow-xl transition-all duration-300 hover:border-[#3B82F6]"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-block mb-4 p-4 bg-[#3B82F6]/20 rounded-lg border border-[#3B82F6]/50 group-hover:bg-[#3B82F6]/30 transition">
                <span className="text-5xl">👨‍💻</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-3">
                Developer
              </h2>

              {/* Description */}
              <p className="text-gray-300 mb-6">
                Build your portfolio, earn CELO rewards, and exchange skills with other developers.
              </p>

              {/* Features */}
              <ul className="text-sm text-gray-300 space-y-2 mb-6 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-[#3B82F6]">✓</span> Portfolio NFT
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#3B82F6]">✓</span> Earn CELO
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#3B82F6]">✓</span> Skill Exchange
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#3B82F6]">✓</span> Peer Review
                </li>
              </ul>

              {/* Button */}
              <div className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded border border-[#3B82F6] group-hover:shadow-lg group-hover:shadow-[#3B82F6]/50 transition inline-block w-full text-center">
                Sign Up as Developer
              </div>
            </div>
          </Link>

          {/* Recruiter Card */}
          <Link
            href="/sign-up/recruiter"
            className="group block p-8 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg hover:shadow-xl transition-all duration-300 hover:border-red-500"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-block mb-4 p-4 bg-red-500/20 rounded-lg border border-red-500/50 group-hover:bg-red-500/30 transition">
                <span className="text-5xl">💼</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-3">
                Recruiter
              </h2>

              {/* Description */}
              <p className="text-gray-300 mb-6">
                Post assignments, review submissions, manage payments, and hire verified developers.
              </p>

              {/* Features */}
              <ul className="text-sm text-gray-300 space-y-2 mb-6 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✓</span> Post Assignments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✓</span> Review Submissions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✓</span> Manage Payments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✓</span> Hire Talent
                </li>
              </ul>

              {/* Button */}
              <div className="px-6 py-3 bg-red-600 text-white font-bold rounded border border-red-600 group-hover:shadow-lg group-hover:shadow-red-600/50 transition inline-block w-full text-center">
                Sign Up as Recruiter
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-bold text-[#3B82F6] hover:text-[#60A5FA] transition">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
