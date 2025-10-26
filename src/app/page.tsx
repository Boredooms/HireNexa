'use client'

import Link from 'next/link'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronRight, Zap, Shield, Sparkles, Code2, Users, Rocket, Lock, Zap as ZapIcon, Package, RefreshCw, Target, Lock as LockIcon } from 'lucide-react'

const Orb = dynamic(() => import('@/components/Orb'), { ssr: false })

export default function Home() {
  const [activeRole, setActiveRole] = useState<string | null>(null)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">
              HireNexa
            </div>
            <span className="px-3 py-1 bg-gradient-to-r from-[#3B82F6]/20 to-[#60A5FA]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">
              BETA
            </span>
          </div>
          <div className="hidden md:flex gap-8">
            <button onClick={() => scrollToSection('features')} className="font-medium hover:text-[#3B82F6] transition">
              Features
            </button>
            <button onClick={() => scrollToSection('roles')} className="font-medium hover:text-[#3B82F6] transition">
              For You
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="font-medium hover:text-[#3B82F6] transition">
              How It Works
            </button>
          </div>
          <div>
            <Link
              href="/get-started"
              className="px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full font-bold text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Orb */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-black to-[#0f0f1e] z-0" />
        
        {/* Orb container */}
        <div className="absolute inset-0 flex items-center justify-center z-1 opacity-60">
          <div className="w-96 h-96 md:w-[600px] md:h-[600px]">
            <Orb hue={240} hoverIntensity={0.3} rotateOnHover={true} />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-[#3B82F6]/10 to-[#60A5FA]/10 border border-[#3B82F6]/30 rounded-full">
            <span className="text-sm font-semibold bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">
              ✨ Blockchain-Powered Recruitment
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            Hire Talent with
            <br />
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#3B82F6] bg-clip-text text-transparent">
              Verified Skills
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            AI-powered skill verification, blockchain credentials, and encrypted portfolios.
            <br className="hidden md:block" />
            The future of recruitment is here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link
              href="/get-started"
              className="px-8 py-4 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full font-bold text-white hover:shadow-xl hover:shadow-[#3B82F6]/50 transition flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ChevronRight size={20} />
            </Link>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="px-8 py-4 bg-white/10 border border-white/20 rounded-full font-bold hover:bg-white/20 transition"
            >
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">95%</div>
              <div className="text-sm text-gray-400 mt-2">Skill Accuracy</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">100%</div>
              <div className="text-sm text-gray-400 mt-2">Tamper-Proof</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition">
              <div className="text-4xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">&lt; 10s</div>
              <div className="text-sm text-gray-400 mt-2">Verification</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative z-20 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400">Everything you need for modern recruitment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/20 rounded-xl p-8 hover:bg-white/10 backdrop-blur-sm transition-all group">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Blockchain Credentials</h3>
              <p className="text-gray-300 mb-4">
                Tamper-proof NFT credentials stored on Celo blockchain. Skills verified forever.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">ERC-721</span>
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">Celo</span>
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">IPFS</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-xl p-8 hover:bg-white/10 backdrop-blur-sm transition-all group">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">AI Skill Verification</h3>
              <p className="text-gray-300 mb-4">
                Multi-agent AI analyzes GitHub repos. 95% accuracy in skill extraction and verification.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">Gemini</span>
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">Groq</span>
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">DeepSeek</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-xl p-8 hover:bg-white/10 backdrop-blur-sm transition-all group">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">IPFS Portfolios</h3>
              <p className="text-gray-300 mb-4">
                Decentralized portfolio storage. Your data, your control. Always accessible.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">Pinata</span>
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">IPFS</span>
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">Web3</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-xl p-8 hover:bg-white/10 backdrop-blur-sm transition-all group">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Auto-Updating NFTs</h3>
              <p className="text-gray-300 mb-4">
                Portfolio updates every 3-6 months. Smart contract enforced. Always current.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">Smart Contracts</span>
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">Versioning</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-xl p-8 hover:bg-white/10 backdrop-blur-sm transition-all group">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">AI Job Matching</h3>
              <p className="text-gray-300 mb-4">
                Smart matching algorithm. Find perfect candidates or jobs instantly.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">ML</span>
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">AI</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-xl p-8 hover:bg-white/10 backdrop-blur-sm transition-all group">
              <div className="w-12 h-12 bg-[#3B82F6]/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Enterprise Security</h3>
              <p className="text-gray-300 mb-4">
                AES-256-GCM encryption. RLS enabled. Your data is safe and private.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">AES-256</span>
                <span className="px-3 py-1 bg-[#3B82F6]/20 border border-[#3B82F6]/50 rounded-full text-xs font-bold text-[#3B82F6]">RLS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Sections */}
      <section id="roles" className="py-20 px-4 bg-gradient-to-br from-black via-[#0f0f1e] to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4">Built For Everyone</h2>
            <p className="text-xl text-gray-400">Choose your role and get started in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Job Seekers / Candidates */}
            <div 
              className={`bg-white/5 border border-white/20 rounded-xl p-8 cursor-pointer transition-all backdrop-blur-sm group ${
                activeRole === 'candidate' ? 'bg-white/10 border-[#3B82F6]/50 shadow-lg shadow-[#3B82F6]/20' : 'hover:bg-white/10 hover:border-white/30'
              }`}
              onClick={() => setActiveRole('candidate')}
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">👨‍💻</div>
              <h3 className="text-3xl font-bold mb-4 text-white">Job Seekers</h3>
              <p className="text-gray-300 mb-6">
                Showcase your skills with blockchain-verified credentials
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Connect GitHub & auto-generate portfolio</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Get AI-verified skill credentials (NFTs)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Match with perfect job opportunities</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Store portfolio on IPFS forever</span>
                </div>
              </div>

              <Link
                href="/sign-up"
                className="block w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg font-bold text-white text-center hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
              >
                Start Building Portfolio
              </Link>
              
              <div className="mt-4 text-center">
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-[#3B82F6] underline">
                  View Dashboard Demo →
                </Link>
              </div>
            </div>

            {/* Recruiters / Companies */}
            <div 
              className={`bg-white/5 border border-white/20 rounded-xl p-8 cursor-pointer transition-all backdrop-blur-sm group ${
                activeRole === 'recruiter' ? 'bg-white/10 border-[#3B82F6]/50 shadow-lg shadow-[#3B82F6]/20' : 'hover:bg-white/10 hover:border-white/30'
              }`}
              onClick={() => setActiveRole('recruiter')}
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🏢</div>
              <h3 className="text-3xl font-bold mb-4 text-white">Recruiters</h3>
              <p className="text-gray-300 mb-6">
                Find verified talent with blockchain-backed skills
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Post jobs with smart contract escrow</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">AI-powered candidate matching</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Verify skills on blockchain instantly</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Real-time application tracking</span>
                </div>
              </div>

              <Link
                href="/sign-up"
                className="block w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg font-bold text-white text-center hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
              >
                Start Hiring Now
              </Link>
              
              <div className="mt-4 text-center">
                <Link href="/dashboard/recruiter" className="text-sm text-gray-400 hover:text-[#3B82F6] underline">
                  View Recruiter Dashboard →
                </Link>
              </div>
            </div>

            {/* Peer Reviewers / Verifiers */}
            <div 
              className={`bg-white/5 border border-white/20 rounded-xl p-8 cursor-pointer transition-all backdrop-blur-sm group ${
                activeRole === 'verifier' ? 'bg-white/10 border-[#3B82F6]/50 shadow-lg shadow-[#3B82F6]/20' : 'hover:bg-white/10 hover:border-white/30'
              }`}
              onClick={() => setActiveRole('verifier')}
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">⭐</div>
              <h3 className="text-3xl font-bold mb-4 text-white">Peer Reviewers</h3>
              <p className="text-gray-300 mb-6">
                Earn rewards by verifying developer skills
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Review code & verify skills</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Earn cUSD tokens for reviews</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Build reputation on blockchain</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#3B82F6] font-bold">✓</span>
                  <span className="text-sm text-gray-300">Admin approval required</span>
                </div>
              </div>

              <Link
                href="/sign-up"
                className="block w-full px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg font-bold text-white text-center hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
              >
                Apply as Reviewer
              </Link>
              
              <div className="mt-4 text-center">
                <Link href="/dashboard/peer-review" className="text-sm text-gray-400 hover:text-[#3B82F6] underline">
                  View Reviewer Dashboard →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Get started in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-[#3B82F6]/30">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Sign Up & Connect</h3>
              <p className="text-gray-400">
                Create your account and connect your GitHub. Our AI analyzes your repositories instantly.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 text-white group-hover:scale-110 transition-transform shadow-lg shadow-[#3B82F6]/30">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Get Verified</h3>
              <p className="text-gray-400">
                AI extracts your skills, peer reviewers verify them, and you receive blockchain NFT credentials.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 text-white group-hover:scale-110 transition-transform shadow-lg shadow-[#3B82F6]/30">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Start Hiring/Applying</h3>
              <p className="text-gray-400">
                Match with opportunities, verify candidates, or earn by reviewing. All powered by blockchain.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/get-started"
              className="inline-block px-12 py-4 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg font-bold text-xl text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#3B82F6]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Transform Recruitment?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of developers and companies using blockchain-verified credentials
          </p>
          <div className="text-center">
            <Link
              href="/get-started"
              className="inline-block px-10 py-4 bg-white rounded-lg font-bold text-xl text-[#3B82F6] hover:bg-gray-100 transition shadow-lg shadow-white/30"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent mb-4">HireNexa</h3>
              <p className="text-gray-400">
                Blockchain-powered recruitment with AI-verified skills
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-[#3B82F6] transition">Features</Link></li>
                <li><Link href="#roles" className="hover:text-[#3B82F6] transition">For You</Link></li>
                <li><Link href="#how-it-works" className="hover:text-[#3B82F6] transition">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Roles</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-[#3B82F6] transition">Job Seekers</Link></li>
                <li><Link href="/dashboard/recruiter" className="hover:text-[#3B82F6] transition">Recruiters</Link></li>
                <li><Link href="/dashboard/peer-review" className="hover:text-[#3B82F6] transition">Peer Reviewers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Technology</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://celo.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#3B82F6] transition">Celo Blockchain</a></li>
                <li><a href="https://ipfs.io" target="_blank" rel="noopener noreferrer" className="hover:text-[#3B82F6] transition">IPFS Storage</a></li>
                <li><a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#3B82F6] transition">Supabase</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-400">
            <p>&copy; 2025 HireNexa. Built with Celo, Supabase, and IPFS • 100% Open Source</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
