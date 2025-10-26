import { SignIn } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RecruiterSignInPage() {
  // Redirect if already logged in
  const { userId } = await auth()
  if (userId) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-red-600 hover:text-red-700 transition"
        >
          ← Back to Sign In
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 p-3 bg-red-100 rounded-lg border-2 border-red-600">
            <span className="text-3xl">💼</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Recruiter Sign In
          </h1>
          <p className="text-gray-600">
            Sign in to manage assignments and hire top talent
          </p>
        </div>

        {/* Clerk Sign In */}
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border-2 border-red-200"
            }
          }}
          signUpUrl="/sign-up/recruiter"
          redirectUrl="/dashboard"
        />

        {/* Info Box */}
        <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Recruiter Account:</strong> Post assignments, review submissions, manage payments, and hire verified developers.
          </p>
        </div>

        {/* Switch to Developer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Are you a developer?</p>
          <Link
            href="/sign-in/user"
            className="inline-block px-6 py-2 bg-white border-2 border-red-600 text-red-600 font-bold rounded hover:bg-red-50 transition"
          >
            Sign In as Developer
          </Link>
        </div>
      </div>
    </div>
  )
}
