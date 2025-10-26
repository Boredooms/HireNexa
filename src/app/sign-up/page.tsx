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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
      <div className="w-full max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Join <span className="text-green-600">HireNexa</span>
          </h1>
          <p className="text-xl text-gray-600">
            Choose your role to get started
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Developer Card */}
          <Link
            href="/sign-up/user"
            className="group block p-8 bg-white border-2 border-black rounded-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-600"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-block mb-4 p-4 bg-indigo-100 rounded-lg border-2 border-indigo-600 group-hover:bg-indigo-200 transition">
                <span className="text-5xl">👨‍💻</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Developer
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                Build your portfolio, earn CELO rewards, and exchange skills with other developers.
              </p>

              {/* Features */}
              <ul className="text-sm text-gray-700 space-y-2 mb-6 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> Portfolio NFT
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> Earn CELO
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> Skill Exchange
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> Peer Review
                </li>
              </ul>

              {/* Button */}
              <div className="px-6 py-3 bg-indigo-600 text-white font-bold rounded border-2 border-indigo-600 group-hover:bg-indigo-700 transition inline-block w-full text-center">
                Sign Up as Developer
              </div>
            </div>
          </Link>

          {/* Recruiter Card */}
          <Link
            href="/sign-up/recruiter"
            className="group block p-8 bg-white border-2 border-black rounded-lg hover:shadow-xl transition-all duration-300 hover:border-red-600"
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-block mb-4 p-4 bg-red-100 rounded-lg border-2 border-red-600 group-hover:bg-red-200 transition">
                <span className="text-5xl">💼</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Recruiter
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                Post assignments, review submissions, manage payments, and hire verified developers.
              </p>

              {/* Features */}
              <ul className="text-sm text-gray-700 space-y-2 mb-6 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-red-600">✓</span> Post Assignments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">✓</span> Review Submissions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">✓</span> Manage Payments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">✓</span> Hire Talent
                </li>
              </ul>

              {/* Button */}
              <div className="px-6 py-3 bg-red-600 text-white font-bold rounded border-2 border-red-600 group-hover:bg-red-700 transition inline-block w-full text-center">
                Sign Up as Recruiter
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-bold text-green-600 hover:text-green-700 transition">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
