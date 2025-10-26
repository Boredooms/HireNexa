import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Trophy, ArrowLeft, ExternalLink, FileText } from 'lucide-react'

export default async function CertificatesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user's certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, assignments:related_assignment_id(title, company_name)')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#3B82F6]" />
              My Certificates
            </h1>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white/10 border border-white/20 text-gray-300 font-bold rounded-lg hover:bg-white/20 transition flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {certificates && certificates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-5 hover:bg-white/10 transition-all"
              >
                {/* Certificate Header */}
                <div className="text-center mb-4">
                  <div className="inline-block mb-2 p-3 bg-[#3B82F6]/20 rounded-lg">
                    <Trophy className="w-6 h-6 text-[#3B82F6]" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Certificate of Completion
                  </h3>
                  <p className="text-xs text-gray-400">
                    {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Assignment Info */}
                <div className="border-t border-white/10 pt-3 mb-3">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Assignment:</p>
                  <p className="font-bold text-white text-sm mb-1">
                    {cert.assignments?.title || 'Assignment Completed'}
                  </p>
                  {cert.assignments?.company_name && (
                    <p className="text-xs text-gray-400">
                      By: {cert.assignments.company_name}
                    </p>
                  )}
                </div>

                {/* Blockchain Info */}
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#3B82F6] bg-[#3B82F6]/20 px-2 py-1 rounded border border-[#3B82F6]/50">
                      ✓ Verified on Blockchain
                    </span>
                  </div>
                  
                  {cert.blockchain_tx_hash && (
                    <a
                      href={`https://celo-sepolia.blockscout.com/tx/${cert.blockchain_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#3B82F6] hover:text-[#60A5FA] transition flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Blockchain
                    </a>
                  )}

                  {cert.metadata_ipfs && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${cert.metadata_ipfs}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#3B82F6] hover:text-[#60A5FA] transition flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      View Metadata
                    </a>
                  )}
                </div>

                {/* NFT Token ID */}
                {cert.nft_token_id && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">NFT Token ID:</p>
                    <p className="text-xs font-mono font-bold text-[#3B82F6] break-all">
                      #{cert.nft_token_id}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
            <div className="inline-block mb-4 p-4 bg-[#3B82F6]/20 rounded-lg">
              <Trophy className="w-8 h-8 text-[#3B82F6]" />
            </div>
            <p className="text-gray-300 text-base mb-2">No certificates yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Complete assignments to earn blockchain-verified certificates!
            </p>
            <Link
              href="/dashboard/assignments"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
            >
              Browse Assignments
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
