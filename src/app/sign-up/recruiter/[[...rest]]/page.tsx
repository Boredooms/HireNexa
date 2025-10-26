import { SignUp } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RecruiterSignUpPage() {
  // Redirect if already logged in
  const { userId } = await auth()
  if (userId) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-red-400 hover:text-red-300 transition"
        >
          ← Back to Sign Up
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 p-3 bg-red-500/20 rounded-lg border border-red-500/50">
            <span className="text-3xl">💼</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Recruiter Sign Up
          </h1>
          <p className="text-gray-400">
            Create your account to start hiring
          </p>
        </div>

        {/* Clerk Sign Up */}
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg",
              formButtonPrimary: "bg-red-600 hover:bg-red-700 text-white font-semibold",
              formFieldInput: "bg-white/10 border border-white/20 text-white placeholder-gray-400",
              formFieldLabel: "text-gray-300",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "border border-white/20 hover:bg-white/10",
              dividerLine: "bg-white/20",
              dividerText: "text-gray-400"
            }
          }}
          signInUrl="/sign-in/recruiter"
          redirectUrl="/dashboard"
        />

        {/* Info Box */}
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-gray-300">
            <strong>Recruiter Account:</strong> Post assignments, review submissions, manage payments, and hire verified developers.
          </p>
        </div>

        {/* Switch to Developer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-3">Are you a developer?</p>
          <Link
            href="/sign-up/user"
            className="inline-block px-6 py-2 bg-white/10 border border-white/20 text-red-400 font-bold rounded hover:bg-white/20 transition"
          >
            Sign Up as Developer
          </Link>
        </div>
      </div>
    </div>
  )
}
