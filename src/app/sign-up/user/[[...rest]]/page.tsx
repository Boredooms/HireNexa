import { SignUp } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function UserSignUpPage() {
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
          className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-[#3B82F6] hover:text-[#60A5FA] transition"
        >
          ← Back to Sign Up
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 p-3 bg-[#3B82F6]/20 rounded-lg border border-[#3B82F6]/50">
            <span className="text-3xl">👨‍💻</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Developer Sign Up
          </h1>
          <p className="text-gray-400">
            Create your account to start building
          </p>
        </div>

        {/* Clerk Sign Up */}
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg",
              formButtonPrimary: "bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold",
              formFieldInput: "bg-white/10 border border-white/20 text-white placeholder-gray-400",
              formFieldLabel: "text-gray-300",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "border border-white/20 hover:bg-white/10",
              dividerLine: "bg-white/20",
              dividerText: "text-gray-400"
            }
          }}
          signInUrl="/sign-in/user"
          redirectUrl="/dashboard"
        />

        {/* Info Box */}
        <div className="mt-6 p-4 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg">
          <p className="text-sm text-gray-300">
            <strong>Developer Account:</strong> Build your portfolio, earn CELO rewards, and exchange skills with other developers.
          </p>
        </div>

        {/* Switch to Recruiter */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-3">Are you a recruiter?</p>
          <Link
            href="/sign-up/recruiter"
            className="inline-block px-6 py-2 bg-white/10 border border-white/20 text-[#3B82F6] font-bold rounded hover:bg-white/20 transition"
          >
            Sign Up as Recruiter
          </Link>
        </div>
      </div>
    </div>
  )
}
