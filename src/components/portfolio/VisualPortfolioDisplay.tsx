'use client'

/**
 * Visual Portfolio Display - Compact, Icon-Based, Chart-Driven
 * Replaces long text blocks with visual elements
 */

interface VisualPortfolioProps {
  portfolio: any
}

export default function VisualPortfolioDisplay({ portfolio }: VisualPortfolioProps) {
  // Debug: Log portfolio structure
  console.log('📊 Portfolio data:', portfolio)
  console.log('📊 Skills:', portfolio.skills)
  console.log('📊 Projects:', portfolio.projects)
  
  // Calculate stats - handle different data structures
  const skills = portfolio.skills || []
  const projects = portfolio.projects || []
  
  const totalSkills = skills.length
  const totalProjects = projects.length
  const totalStars = projects.reduce((sum: number, p: any) => sum + (p.stars || 0), 0)
  
  // Handle both confidence and confidence_score fields
  const avgConfidence = skills.length > 0 
    ? skills.reduce((sum: number, s: any) => sum + (s.confidence || s.confidence_score || 0), 0) / skills.length 
    : 0
  
  console.log('📊 Calculated stats:', { totalSkills, totalProjects, totalStars, avgConfidence })

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          {portfolio.avatar_url && (
            <img
              src={portfolio.avatar_url}
              alt={portfolio.full_name}
              className="w-16 h-16 rounded-full border-4 border-white/30"
            />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{portfolio.full_name || 'Developer'}</h2>
            <p className="text-indigo-100 text-sm">{portfolio.career_level || 'Software Engineer'}</p>
            {portfolio.github_username && (
              <a
                href={`https://github.com/${portfolio.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-white/90 hover:text-white mt-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                @{portfolio.github_username}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats Dashboard - Compact */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20 text-center hover:bg-white/10 transition">
          <div className="text-3xl font-bold text-[#3B82F6]">{totalSkills}</div>
          <div className="text-xs text-gray-400 mt-1">Skills</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20 text-center hover:bg-white/10 transition">
          <div className="text-3xl font-bold text-[#3B82F6]">{totalProjects}</div>
          <div className="text-xs text-gray-400 mt-1">Projects</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20 text-center hover:bg-white/10 transition">
          <div className="text-3xl font-bold text-[#3B82F6]">{totalStars}</div>
          <div className="text-xs text-gray-400 mt-1">⭐ Stars</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20 text-center hover:bg-white/10 transition">
          <div className="text-3xl font-bold text-[#3B82F6]">{Math.round(avgConfidence)}%</div>
          <div className="text-xs text-gray-400 mt-1">Confidence</div>
        </div>
      </div>

      {/* Professional Summary - Compact */}
      {portfolio.professional_summary && (
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <div className="flex items-start gap-2">
            <span className="text-2xl">✨</span>
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm mb-1">AI Summary</h3>
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                {portfolio.professional_summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Skills - Visual Bars (Compact) */}
      {portfolio.skills && portfolio.skills.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <span className="text-lg">💡</span> Top Skills
          </h3>
          <div className="space-y-2">
            {skills.slice(0, 8).map((skill: any, index: number) => {
              const skillName = skill.name || skill.skill_name || 'Unknown'
              const confidence = skill.confidence || skill.confidence_score || 50
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-24 text-xs font-semibold text-gray-400 truncate">
                    {skillName}
                  </div>
                  <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full transition-all"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  <div className="w-10 text-xs text-gray-400 text-right">
                    {confidence}%
                  </div>
                </div>
              )
            })}
          </div>
          {skills.length > 8 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              +{skills.length - 8} more
            </p>
          )}
        </div>
      )}

      {/* Best Projects - Compact Cards */}
      {portfolio.featuredProjects && portfolio.featuredProjects.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <span className="text-lg">🏆</span> Best Projects (AI Selected)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {portfolio.featuredProjects.map((project: any, index: number) => (
              <div key={index} className="p-3 border border-[#3B82F6]/50 bg-[#3B82F6]/10 rounded-lg hover:bg-[#3B82F6]/20 transition">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-sm text-white truncate flex-1">
                    {project.name}
                  </h4>
                  {project.stars > 0 && (
                    <span className="text-xs text-[#3B82F6] font-semibold">
                      ⭐ {project.stars}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                  {project.description || 'No description'}
                </p>
                {project.why && (
                  <div className="bg-white/5 p-2 rounded text-xs text-gray-400 line-clamp-2 border border-white/10">
                    <span className="font-semibold text-white">Why:</span> {project.why}
                  </div>
                )}
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#3B82F6] hover:text-[#60A5FA] mt-2 inline-block transition"
                  >
                    View →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Projects - Compact Grid */}
      {portfolio.projects && portfolio.projects.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <span className="text-lg">📦</span> All Repositories ({portfolio.projects.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {portfolio.projects.slice(0, 12).map((project: any, index: number) => (
              <a
                key={index}
                href={project.url || project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-white/20 rounded hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/10 transition"
              >
                <div className="font-semibold text-xs text-white truncate">
                  {project.name}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  {project.stars > 0 && <span>⭐ {project.stars}</span>}
                  {project.forks > 0 && <span>🔱 {project.forks}</span>}
                </div>
              </a>
            ))}
          </div>
          {portfolio.projects.length > 12 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              +{portfolio.projects.length - 12} more repositories
            </p>
          )}
        </div>
      )}

      {/* Key Strengths - Icon Badges */}
      {portfolio.key_strengths && portfolio.key_strengths.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <span className="text-lg">💪</span> Key Strengths
          </h3>
          <div className="flex flex-wrap gap-2">
            {portfolio.key_strengths.map((strength: string, index: number) => (
              <div
                key={index}
                className="px-3 py-1 bg-[#3B82F6]/20 text-[#3B82F6] rounded-full text-xs font-semibold border border-[#3B82F6]/50"
              >
                ✓ {strength}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Distribution Chart - Horizontal Bars (Readable) */}
      {portfolio.skills && portfolio.skills.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <span className="text-lg">📊</span> Top 12 Skills
          </h3>
          <div className="space-y-2">
            {skills.slice(0, 12).map((skill: any, index: number) => {
              const skillName = skill.name || skill.skill_name || 'Unknown'
              const confidence = skill.confidence || skill.confidence_score || 50
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-32 text-xs font-medium text-gray-400 truncate" title={skillName}>
                    {skillName}
                  </div>
                  <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full transition-all"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  <div className="w-10 text-xs text-gray-400 text-right font-semibold">
                    {confidence}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
