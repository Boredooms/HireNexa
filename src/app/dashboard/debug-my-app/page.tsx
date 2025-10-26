'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function DebugMyAppPage() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkMyApp = async () => {
      try {
        const response = await fetch(`/api/debug/check-my-recruiter-app?userId=${userId}`)
        const result = await response.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      checkMyApp()
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
        <div className="text-xl font-bold">Checking your application...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      <header className="bg-white shadow border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-black">My Recruiter Application</h1>
          <p className="text-gray-600 mt-2">Check if your application was saved</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border-2 border-black rounded-lg p-8">
          {error ? (
            <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg">
              <p className="text-red-700 font-bold">Error: {error}</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              <div className="p-4 bg-blue-100 border-2 border-blue-500 rounded-lg">
                <p className="text-blue-700 font-bold text-lg">
                  {data.found ? '✅ Application Found!' : '❌ No Application Found'}
                </p>
              </div>

              {data.found ? (
                <div className="space-y-4">
                  <div className="border-2 border-black rounded-lg p-6 bg-[#FFFEF7]">
                    <h3 className="text-xl font-bold text-black mb-4">Your Application Details:</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-bold text-black">Company Name:</label>
                        <p className="text-gray-700">{data.application?.company_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-black">Company Description:</label>
                        <p className="text-gray-700">{data.application?.company_description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-black">Status:</label>
                        <p className="text-gray-700 font-bold">
                          <span className={`px-3 py-1 rounded ${
                            data.application?.status === 'pending' ? 'bg-yellow-200' :
                            data.application?.status === 'approved' ? 'bg-green-200' :
                            'bg-red-200'
                          }`}>
                            {data.application?.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-black">Applied At:</label>
                        <p className="text-gray-700">
                          {new Date(data.application?.applied_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-black">Why Join Platform:</label>
                        <p className="text-gray-700">{data.application?.why_join_platform}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-100 border-2 border-green-500 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-green-800 mb-3">✅ Great!</h3>
                    <p className="text-green-800 mb-4">
                      Your application is in the database. Now:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-green-800">
                      <li>Go to <Link href="/dashboard/admin" className="text-blue-600 hover:underline font-bold">/dashboard/admin</Link></li>
                      <li>You should see your application in "Pending Recruiter Applications"</li>
                      <li>Click "✓ Approve" to become a recruiter</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="bg-red-100 border-2 border-red-500 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-red-800 mb-3">❌ Application Not Found</h3>
                  <p className="text-red-800 mb-4">
                    Your application wasn't saved. Try submitting again:
                  </p>
                  <Link 
                    href="/dashboard/recruiter/apply"
                    className="inline-block px-6 py-3 bg-[#35D07F] text-white font-bold rounded border-2 border-black hover:bg-[#2ab56f]"
                  >
                    Go to Recruiter Application Form
                  </Link>
                </div>
              )}

              {data.allApplications && data.allApplications.length > 0 && (
                <div className="border-2 border-black rounded-lg p-6">
                  <h3 className="text-lg font-bold text-black mb-4">All Recruiter Applications in Database:</h3>
                  <div className="space-y-2 text-sm">
                    {data.allApplications.map((app: any, idx: number) => (
                      <div key={idx} className="p-2 bg-gray-100 rounded">
                        <p><strong>User ID:</strong> {app.user_id}</p>
                        <p><strong>Company:</strong> {app.company_name}</p>
                        <p><strong>Status:</strong> {app.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
