'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function FullDiagnosticPage() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const runDiagnostic = async () => {
      try {
        const response = await fetch(`/api/debug/full-diagnostic?userId=${userId}`)
        const result = await response.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      runDiagnostic()
    }
  }, [userId])

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Please sign in first</p>
          <Link href="/sign-in" className="px-6 py-3 bg-[#FCFF52] text-black font-bold rounded border-2 border-black">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
        <div className="text-xl font-bold">Running full diagnostic...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      <header className="bg-white shadow border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-black">🔍 Full System Diagnostic</h1>
          <p className="text-gray-600 mt-2">Complete system health check</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg">
            <p className="text-red-700 font-bold">Error: {error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">👤 User Information</h2>
              <div className="space-y-2">
                <p><strong>User ID:</strong> {data.userId}</p>
                <p><strong>User Role:</strong> <span className={`px-3 py-1 rounded font-bold ${data.userRole === 'admin' ? 'bg-green-200' : 'bg-yellow-200'}`}>{data.userRole}</span></p>
                <p><strong>Is Admin:</strong> {data.isAdmin ? '✅ YES' : '❌ NO'}</p>
              </div>
            </div>

            {/* Database Tables */}
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">🗄️ Database Tables</h2>
              <div className="space-y-3">
                <div className="p-3 bg-green-100 border border-green-300 rounded">
                  <p className="font-bold">✅ recruiter_applications: {data.recruiterAppsCount} records</p>
                </div>
                <div className="p-3 bg-green-100 border border-green-300 rounded">
                  <p className="font-bold">✅ peer_reviewer_applications: {data.peerAppsCount} records</p>
                </div>
              </div>
            </div>

            {/* My Application */}
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">📋 My Recruiter Application</h2>
              {data.myApplication ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-100 border border-blue-300 rounded">
                    <p className="font-bold">✅ Application Found!</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Company:</strong> {data.myApplication.company_name}</p>
                    <p><strong>Status:</strong> <span className={`px-3 py-1 rounded font-bold ${data.myApplication.status === 'pending' ? 'bg-yellow-200' : data.myApplication.status === 'approved' ? 'bg-green-200' : 'bg-red-200'}`}>{data.myApplication.status}</span></p>
                    <p><strong>Applied:</strong> {new Date(data.myApplication.applied_at).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-100 border border-red-300 rounded">
                  <p className="font-bold">❌ No Application Found</p>
                </div>
              )}
            </div>

            {/* API Endpoints */}
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">🔌 API Endpoints</h2>
              <div className="space-y-3">
                <div className={`p-3 border rounded ${data.apiStatus?.getApplications ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                  <p className="font-bold">{data.apiStatus?.getApplications ? '✅' : '❌'} GET /api/admin/get-applications</p>
                  {data.apiStatus?.getApplicationsError && <p className="text-sm text-red-700">{data.apiStatus.getApplicationsError}</p>}
                </div>
                <div className={`p-3 border rounded ${data.apiStatus?.recruiterApply ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                  <p className="font-bold">{data.apiStatus?.recruiterApply ? '✅' : '❌'} POST /api/recruiter/apply</p>
                </div>
                <div className={`p-3 border rounded ${data.apiStatus?.adminApprove ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                  <p className="font-bold">{data.apiStatus?.adminApprove ? '✅' : '❌'} POST /api/admin/recruiter/approve</p>
                </div>
              </div>
            </div>

            {/* Authorization Check */}
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">🔐 Authorization</h2>
              <div className="space-y-3">
                <div className={`p-3 border rounded ${data.isAdmin ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                  <p className="font-bold">{data.isAdmin ? '✅' : '❌'} Admin Role Check</p>
                  {!data.isAdmin && <p className="text-sm text-red-700">User is not an admin. Cannot access admin endpoints.</p>}
                </div>
                <div className={`p-3 border rounded ${data.canAccessAdmin ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                  <p className="font-bold">{data.canAccessAdmin ? '✅' : '❌'} Can Access Admin Dashboard</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-yellow-800 mb-4">💡 Recommendations</h2>
              <ol className="list-decimal list-inside space-y-2 text-yellow-800">
                {!data.isAdmin && <li>You are not an admin. Go to <Link href="/dashboard/admin-setup" className="text-blue-600 hover:underline font-bold">/dashboard/admin-setup</Link> to become admin.</li>}
                {data.myApplication && data.myApplication.status === 'pending' && <li>Your application is pending. Go to <Link href="/dashboard/admin" className="text-blue-600 hover:underline font-bold">/dashboard/admin</Link> to approve it.</li>}
                {!data.myApplication && <li>You don't have a recruiter application. Go to <Link href="/dashboard/recruiter/apply" className="text-blue-600 hover:underline font-bold">/dashboard/recruiter/apply</Link> to submit one.</li>}
              </ol>
            </div>

            {/* Raw Data */}
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-4">📊 Raw Diagnostic Data</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
