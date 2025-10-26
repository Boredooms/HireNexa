import { SignIn } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function UserSignInPage() {
  // Redirect if already logged in
  const { userId } = await auth()
  if (userId) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
        >
          ← Back to Sign In
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 p-3 bg-indigo-100 rounded-lg border-2 border-indigo-600">
            <span className="text-3xl">👨‍💻</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Developer Sign In
          </h1>
          <p className="text-gray-600">
            Sign in to access your skill-building dashboard
          </p>
        </div>

        {/* Clerk Sign In */}
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border-2 border-indigo-200"
            }
          }}
          signUpUrl="/sign-up/user"
          redirectUrl="/dashboard"
        />

        {/* Info Box */}
        <div className="mt-6 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Developer Account:</strong> Build your portfolio, earn CELO rewards, and exchange skills with other developers.
          </p>
        </div>

        {/* Switch to Recruiter */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Are you a recruiter?</p>
          <Link
            href="/sign-in/recruiter"
            className="inline-block px-6 py-2 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded hover:bg-indigo-50 transition"
          >
            Sign In as Recruiter
          </Link>
        </div>
      </div>
    </div>
  )
}
