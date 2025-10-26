import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function GetStartedPage() {
  // Redirect if already logged in
  const { userId } = await auth()
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <div className="w-full max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Welcome to <span className="text-purple-600">HireNexa</span>
          </h1>
          <p className="text-xl text-gray-600">
            Choose your role to get started
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Developer Card */}
          <Link
            href="/sign-up/user"
            className="group block p-8 bg-white border-2 border-black rounded-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-indigo-600"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-block mb-6 p-6 bg-indigo-100 rounded-full border-2 border-indigo-600 group-hover:bg-indigo-200 transition">
                <span className="text-6xl">👨‍💻</span>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                I'm a Developer
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6 text-lg">
                Build your portfolio, earn CELO rewards, and showcase your skills to top companies.
              </p>

              {/* Features */}
              <ul className="text-sm text-gray-700 space-y-3 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <span className="text-indigo-600 text-xl">✓</span>
                  <span>Create AI-powered portfolio NFT</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-indigo-600 text-xl">✓</span>
                  <span>Complete assignments & earn CELO</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-indigo-600 text-xl">✓</span>
                  <span>Exchange skills with other developers</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-indigo-600 text-xl">✓</span>
                  <span>Get verified skill certificates</span>
                </li>
              </ul>

              {/* Button */}
              <div className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg border-2 border-indigo-600 group-hover:bg-indigo-700 transition text-lg">
                Sign Up as Developer →
              </div>
            </div>
          </Link>

          {/* Recruiter Card */}
          <Link
            href="/sign-up/recruiter"
            className="group block p-8 bg-white border-2 border-black rounded-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-red-600"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-block mb-6 p-6 bg-red-100 rounded-full border-2 border-red-600 group-hover:bg-red-200 transition">
                <span className="text-6xl">💼</span>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                I'm a Recruiter
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6 text-lg">
                Post assignments, review submissions, and hire verified blockchain developers.
              </p>

              {/* Features */}
              <ul className="text-sm text-gray-700 space-y-3 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <span className="text-red-600 text-xl">✓</span>
                  <span>Post skill-based assignments</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-red-600 text-xl">✓</span>
                  <span>Review AI-verified submissions</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-red-600 text-xl">✓</span>
                  <span>Pay with CELO cryptocurrency</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-red-600 text-xl">✓</span>
                  <span>Hire verified talent</span>
                </li>
              </ul>

              {/* Button */}
              <div className="px-8 py-4 bg-red-600 text-white font-bold rounded-lg border-2 border-red-600 group-hover:bg-red-700 transition text-lg">
                Sign Up as Recruiter →
              </div>
            </div>
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-yellow-100 border-2 border-yellow-600 rounded-lg p-6">
            <p className="text-center text-gray-800">
              <strong>Note:</strong> Recruiter accounts require admin approval before you can post assignments. 
              Developer accounts are activated immediately.
            </p>
          </div>
        </div>

        {/* Already have account */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-bold text-purple-600 hover:text-purple-700 transition">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
