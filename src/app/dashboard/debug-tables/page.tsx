'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DebugTablesPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkTables = async () => {
      try {
        const response = await fetch('/api/debug/check-tables')
        const result = await response.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkTables()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
        <div className="text-xl font-bold">Checking tables...</div>
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
          <h1 className="text-3xl font-bold text-black">Database Tables Check</h1>
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
                <p className="text-blue-700 font-bold text-lg">{data.message}</p>
              </div>

              <div className="space-y-4">
                {Object.entries(data.tables).map(([tableName, tableInfo]: [string, any]) => (
                  <div key={tableName} className="border-2 border-black rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">
                        {tableInfo.exists ? '✅' : '❌'}
                      </span>
                      <h3 className="text-xl font-bold text-black">{tableName}</h3>
                    </div>

                    {tableInfo.error && (
                      <div className="bg-red-50 border border-red-300 rounded p-3 mb-3">
                        <p className="text-sm text-red-700">
                          <strong>Error:</strong> {tableInfo.error}
                        </p>
                      </div>
                    )}

                    {tableInfo.exists && (
                      <div className="bg-green-50 border border-green-300 rounded p-3">
                        <p className="text-sm text-green-700">
                          <strong>Status:</strong> Table exists and is accessible
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!data.tables.recruiter_applications.exists || !data.tables.peer_reviewer_applications.exists ? (
                <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-yellow-800 mb-3">⚠️ Action Required</h3>
                  <p className="text-yellow-800 mb-4">
                    The database tables don't exist. You need to run the migration in Supabase:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-yellow-800">
                    <li>Go to Supabase Dashboard</li>
                    <li>Select your project</li>
                    <li>Go to SQL Editor</li>
                    <li>Copy and paste the contents of: <code className="bg-yellow-200 px-2 py-1 rounded">supabase/migrations/add_application_tables.sql</code></li>
                    <li>Run the query</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              ) : (
                <div className="bg-green-100 border-2 border-green-500 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-green-800 mb-3">✅ All Good!</h3>
                  <p className="text-green-800">
                    All tables exist. You can now submit recruiter and peer reviewer applications.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
