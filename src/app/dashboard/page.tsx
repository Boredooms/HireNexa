import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Github, Package, Zap, BookOpen, Trophy, RefreshCw, Sparkles, Shield, Users, Target, Eye, Code2, Briefcase } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch user role and details
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('role, is_recruiter, is_admin')
    .eq('id', userId)
    .single()

  // If user doesn't exist, create them
  if (userError && userError.code === 'PGRST116') {
    console.log('User not found, initializing new user:', userId)
    
    // Get user email from Clerk
    const clerkUser = await currentUser()
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@temp.com`
    const fullName = clerkUser?.fullName || clerkUser?.firstName || 'User'
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: userEmail,
          full_name: fullName,
          role: 'student',
          is_recruiter: false,
          is_admin: false,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      user = {
        role: 'student',
        is_recruiter: false,
        is_admin: false
      }
    } else {
      user = newUser
    }
  } else if (userError) {
    console.error('Error fetching user:', userError)
  }

  const userRole = user?.role || 'student'
  const isRecruiter = user?.is_recruiter === true || user?.role === 'recruiter'
  const isAdmin = user?.is_admin === true || user?.role === 'admin'

  // Fetch real-time stats from database
  const { count: skillsCount } = await supabase
    .from('skills')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Get ONLY the LATEST portfolio (not all duplicates)
  const { data: latestPortfolio, error: portfolioError } = await supabase
    .from('portfolios')
    .select('nft_token_id, blockchain_tx_hash')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (portfolioError) {
    console.error('Error fetching portfolio:', portfolioError)
  }

  console.log('=== DASHBOARD DEBUG ===')
  console.log('Dashboard - User ID:', userId)
  console.log('Dashboard - User Role:', userRole)
  console.log('Dashboard - Is Recruiter:', isRecruiter)
  console.log('Dashboard - Is Admin:', isAdmin)
  console.log('Dashboard - Full User Data:', user)
  console.log('======================')

  // Check if the LATEST portfolio has an NFT
  const hasNFT = latestPortfolio?.nft_token_id && latestPortfolio.nft_token_id > 0
  const nftTokenId = latestPortfolio?.nft_token_id
  
  // Count UNIQUE NFT tokens (not duplicates)
  const nftCount = hasNFT ? 1 : 0
  const portfolioViews = 0 // TODO: Implement view tracking

  // Show appropriate dashboard based on role
  // SECURITY: Recruiters CANNOT access student dashboard (prevent fraud)
  // Admins can access ALL dashboards
  
  if (isRecruiter && !isAdmin) {
    // Regular recruiters MUST use recruiter dashboard only
    // Redirect to prevent them from accessing student features
    redirect('/dashboard/recruiter')
  }

  // Show student/developer dashboard for:
  // 1. Regular students
  // 2. Admins accessing /dashboard (they can navigate to /dashboard/admin or /dashboard/recruiter via sidebar)
  return <StudentDashboard userId={userId} skillsCount={skillsCount} nftCount={nftCount} portfolioViews={portfolioViews} />
}

// Student/Developer Dashboard
function StudentDashboard({ userId, skillsCount, nftCount, portfolioViews }: any) {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      {/* Left Sidebar - 9 Actions */}
      <aside className="fixed left-0 top-0 w-64 bg-black/40 backdrop-blur-md border-r border-white/10 p-6 h-screen overflow-y-auto z-40 scrollbar-hide">
        {/* Switch Role */}
        <Link href="/switch-role" className="block mb-4 p-3 text-center bg-gradient-to-r from-[#3B82F6]/20 to-[#60A5FA]/20 border border-[#3B82F6]/50 rounded-lg hover:bg-[#3B82F6]/30 transition">
          <span className="text-sm font-semibold text-[#3B82F6]">🔄 Switch Dashboard</span>
        </Link>
        
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="text-xl font-bold text-white">Developer</h2>
          </div>
          <p className="text-xs text-gray-400">Quick Access</p>
        </div>

        <nav className="space-y-3">
          <Link
            href="/dashboard/github"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Github className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">GitHub</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Sync repositories</p>
          </Link>

          <Link
            href="/dashboard/portfolio"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Portfolio</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Generate portfolio</p>
          </Link>

          <Link
            href="/dashboard/nft"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Portfolio NFT</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">View NFT</p>
          </Link>

          <Link
            href="/dashboard/assignments"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Assignments</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Browse tasks</p>
          </Link>

          <Link
            href="/dashboard/certificates"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Certificates</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">View certificates</p>
          </Link>

          <Link
            href="/dashboard/skill-exchange"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Skill Exchange</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Trade skills</p>
          </Link>

          <Link
            href="/dashboard/skills"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">My Skills</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Manage skills</p>
          </Link>

          <Link
            href="/dashboard/celo"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Celo</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Blockchain</p>
          </Link>

          <Link
            href="/dashboard/peer-review"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Peer Review</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Verify skills</p>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen max-w-[calc(100vw-16rem)] p-8 bg-gradient-to-br from-black via-[#0f0f1e] to-black">
        {/* Welcome Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8 hover:bg-white/10 transition-all">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, Developer! 👋
          </h2>
          <p className="text-gray-300">
            Build your blockchain-powered professional profile
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-semibold">Skills Verified</p>
                <p className="text-3xl font-bold text-white mt-1">{skillsCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-semibold">NFT Credentials</p>
                <p className="text-3xl font-bold text-white mt-1">{nftCount}</p>
              </div>
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-semibold">Portfolio Views</p>
                <p className="text-3xl font-bold text-white mt-1">{portfolioViews}</p>
              </div>
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Placeholder */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-8 hover:bg-white/10 transition-all">
          <h3 className="text-2xl font-bold text-white mb-4">Dashboard Content</h3>
          <p className="text-gray-400">Select an item from the left sidebar to get started</p>
        </div>
      </main>
    </div>
  )
}

// Recruiter Dashboard
function RecruiterDashboard({ userId, nftCount }: any) {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black">
      {/* Left Sidebar - 4 Sections */}
      <aside className="fixed left-0 top-0 w-64 bg-black/40 backdrop-blur-md border-r border-white/10 p-6 h-screen overflow-y-auto z-40">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-[#3B82F6]" />
            <h2 className="text-xl font-bold text-white">Recruiter</h2>
          </div>
          <p className="text-xs text-gray-400">Quick Access</p>
        </div>

        <nav className="space-y-3">
          <Link
            href="/dashboard/portfolio"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Portfolio</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Company profile</p>
          </Link>

          <Link
            href="/dashboard/nft"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Portfolio NFT</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Blockchain profile</p>
          </Link>

          <Link
            href="/dashboard/recruiter"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Recruiter</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Manage assignments</p>
          </Link>

          <Link
            href="/dashboard/celo"
            className="block p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#3B82F6]/50 transition text-left group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm text-white">Celo</span>
            </div>
            <p className="text-xs text-gray-400 ml-7">Payments & escrow</p>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen w-full p-8 bg-gradient-to-br from-black via-[#0f0f1e] to-black">
        {/* Welcome Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8 hover:bg-white/10 transition-all">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, Recruiter! 💼
          </h2>
          <p className="text-gray-300">
            Manage assignments, review submissions, and hire top talent
          </p>
        </div>

        {/* Recruiter Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-semibold">Active Assignments</p>
                <p className="text-3xl font-bold text-white mt-1">0</p>
              </div>
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-semibold">Total Applications</p>
                <p className="text-3xl font-bold text-white mt-1">0</p>
              </div>
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-semibold">Positions Filled</p>
                <p className="text-3xl font-bold text-white mt-1">0</p>
              </div>
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Placeholder */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-8 hover:bg-white/10 transition-all">
          <h3 className="text-2xl font-bold text-white mb-4">Dashboard Content</h3>
          <p className="text-gray-400">Select an item from the left sidebar to get started</p>
        </div>
      </main>
    </div>
  )
}
