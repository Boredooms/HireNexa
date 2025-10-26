'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Github, Package, Zap, BookOpen, Trophy, RefreshCw, Sparkles, Shield, Users, Menu, X } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  description: string
}

// Student/Developer Navigation Items
const studentNavItems: NavItem[] = [
  {
    label: 'GitHub',
    href: '/dashboard/github',
    icon: <Github className="w-5 h-5" />,
    description: 'Sync repositories',
  },
  {
    label: 'Portfolio',
    href: '/dashboard/portfolio',
    icon: <Package className="w-5 h-5" />,
    description: 'Generate portfolio',
  },
  {
    label: 'Portfolio NFT',
    href: '/dashboard/nft',
    icon: <Zap className="w-5 h-5" />,
    description: 'View NFT',
  },
  {
    label: 'Assignments',
    href: '/dashboard/assignments',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Browse tasks',
  },
  {
    label: 'Certificates',
    href: '/dashboard/certificates',
    icon: <Trophy className="w-5 h-5" />,
    description: 'View certificates',
  },
  {
    label: 'Skill Exchange',
    href: '/dashboard/skill-exchange',
    icon: <RefreshCw className="w-5 h-5" />,
    description: 'Trade skills',
  },
  {
    label: 'My Skills',
    href: '/dashboard/skills',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Manage skills',
  },
  {
    label: 'Celo',
    href: '/dashboard/celo',
    icon: <Shield className="w-5 h-5" />,
    description: 'Blockchain',
  },
  {
    label: 'Peer Review',
    href: '/dashboard/peer-review',
    icon: <Users className="w-5 h-5" />,
    description: 'Verify skills',
  },
]

// Recruiter Navigation Items
const recruiterNavItems: NavItem[] = [
  {
    label: 'Portfolio',
    href: '/dashboard/portfolio',
    icon: <Package className="w-5 h-5" />,
    description: 'Company profile',
  },
  {
    label: 'Portfolio NFT',
    href: '/dashboard/nft',
    icon: <Zap className="w-5 h-5" />,
    description: 'Blockchain profile',
  },
  {
    label: 'Recruiter',
    href: '/dashboard/recruiter',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Post assignments',
  },
  {
    label: 'Celo',
    href: '/dashboard/celo',
    icon: <Shield className="w-5 h-5" />,
    description: 'Payments & escrow',
  },
]

// Admin Navigation Items
const adminNavItems: NavItem[] = [
  {
    label: 'Admin Panel',
    href: '/dashboard/admin',
    icon: <Shield className="w-5 h-5" />,
    description: 'Manage platform',
  },
  {
    label: 'Recruiter',
    href: '/dashboard/recruiter',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Post assignments',
  },
  {
    label: 'Portfolio',
    href: '/dashboard/portfolio',
    icon: <Package className="w-5 h-5" />,
    description: 'Profile',
  },
  {
    label: 'Celo',
    href: '/dashboard/celo',
    icon: <Shield className="w-5 h-5" />,
    description: 'Blockchain',
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { userId } = useAuth()
  const [isRecruiter, setIsRecruiter] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userId) return
      try {
        const response = await fetch('/api/user/role', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        setIsRecruiter(data.isRecruiter || false)
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        console.error('Error fetching user role:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [userId])

  // Determine which navigation items to show based on role
  const navItems = isAdmin ? adminNavItems : (isRecruiter ? recruiterNavItems : studentNavItems)
  const roleLabel = isAdmin ? 'Admin' : (isRecruiter ? 'Recruiter' : 'Developer')

  return (
    <nav className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">
            HireNexa {roleLabel} Dashboard
          </h1>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Horizontal Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {navItems.map((item: NavItem) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] border-[#3B82F6] text-white'
                    : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-[#3B82F6]/50'
                }`}
                title={item.description}
              >
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="hidden sm:inline font-semibold text-sm">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { userId } = useAuth()
  const [isRecruiter, setIsRecruiter] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userId) return
      try {
        const response = await fetch('/api/user/role', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        setIsRecruiter(data.isRecruiter || false)
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        console.error('Error fetching user role:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [userId])

  // Determine which navigation items to show based on CURRENT PAGE (context-aware)
  // This makes the sidebar show relevant items for the page you're on
  let navItems = studentNavItems
  let roleLabel = 'Developer'
  let roleIcon = '👨‍💻'

  if (pathname.startsWith('/dashboard/admin')) {
    // On admin pages, show admin navigation
    navItems = adminNavItems
    roleLabel = 'Admin'
    roleIcon = '🛡️'
  } else if (pathname.startsWith('/dashboard/recruiter')) {
    // On recruiter pages, ALWAYS show recruiter navigation (even for admins)
    navItems = recruiterNavItems
    roleLabel = 'Recruiter'
    roleIcon = '💼'
  } else if (isAdmin) {
    // On other pages, admins see admin navigation
    navItems = adminNavItems
    roleLabel = 'Admin'
    roleIcon = '🛡️'
  } else if (isRecruiter) {
    // Recruiters see recruiter navigation
    navItems = recruiterNavItems
    roleLabel = 'Recruiter'
    roleIcon = '💼'
  }

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-black/40 backdrop-blur-md border-r border-white/10 min-h-screen sticky top-0">
      {/* Header with Logo and Role */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent mb-1">HireNexa</h1>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{roleIcon}</span>
          <p className="text-sm font-semibold text-gray-300">{roleLabel}</p>
        </div>
        {/* Switch Dashboard */}
        <Link href="/switch-role" className="block mt-3 p-3 text-center bg-gradient-to-r from-[#3B82F6]/20 to-[#60A5FA]/20 border border-[#3B82F6]/50 rounded-lg hover:bg-[#3B82F6]/30 transition">
          <span className="text-xs font-semibold text-[#3B82F6]">🔄 Switch Dashboard</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item: NavItem) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block p-3 rounded-lg border transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] border-[#3B82F6] text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-[#3B82F6]/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="font-semibold text-sm">{item.label}</span>
              </div>
              <p className="text-xs opacity-70 ml-8">{item.description}</p>
            </Link>
          )
        })}
      </nav>

      {/* User Button at Bottom */}
      <div className="p-4 border-t border-white/10">
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-10 h-10",
              userButtonPopoverCard: "shadow-xl border border-white/20 bg-black/80 backdrop-blur-md"
            }
          }}
        />
      </div>
    </aside>
  )
}
