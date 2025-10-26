'use client'

import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import Talk from 'talkjs'
import { useRealtimePresence } from '@/hooks/useRealtimePresence'

export default function ChatPage() {
  const { userId } = useAuth()
  const { user } = useUser()
  const params = useParams()
  const router = useRouter()
  const matchId = params.matchId as string
  
  const [matchInfo, setMatchInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chatboxContainer, setChatboxContainer] = useState<HTMLDivElement | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  
  // Real-time presence tracking
  const { isOnline } = useRealtimePresence(userId || '')

  useEffect(() => {
    loadMatchInfo()
    fetchConversationId()
  }, [matchId])

  const fetchConversationId = async () => {
    try {
      const response = await fetch(`/api/skill-exchange/matches?filter=all`)
      const data = await response.json()
      
      // Find the match and get its barter_id
      const match = data.matches?.find((m: any) => m.id === matchId)
      
      if (match?.barter_id) {
        console.log('💬 Using barter ID as conversation:', match.barter_id)
        setConversationId(match.barter_id)
      } else {
        // Fallback: use matchId
        console.log('⚠️ No barter found, using matchId as conversation:', matchId)
        setConversationId(matchId)
      }
    } catch (error) {
      console.error('Error fetching barter:', error)
      setConversationId(matchId) // Fallback
    }
  }

  useEffect(() => {
    if (!user || !matchInfo || !chatboxContainer || !conversationId) return

    Talk.ready.then(() => {
      // Create current user
      const me = new Talk.User({
        id: userId!,
        name: user.fullName || 'User',
        email: user.emailAddresses[0]?.emailAddress,
        photoUrl: user.imageUrl,
        role: 'default'
      })

      // Create other user
      const other = new Talk.User({
        id: matchInfo.user_id,
        name: matchInfo.name,
        photoUrl: matchInfo.avatar_url,
        role: 'default'
      })

      // Create session
      const session = new Talk.Session({
        appId: process.env.NEXT_PUBLIC_TALKJS_APP_ID!,
        me: me
      })

      // Create conversation with barter ID
      const conversation = session.getOrCreateConversation(conversationId) // ✅ Use barter ID!
      conversation.setParticipant(me)
      conversation.setParticipant(other)
      conversation.setAttributes({
        subject: `Chat with ${matchInfo.name}`,
        photoUrl: matchInfo.avatar_url
      })
      
      console.log('💬 Chat conversation created:', conversationId)

      // Create chatbox - TalkJS will use default theme
      const chatbox = session.createChatbox()
      chatbox.select(conversation)
      chatbox.mount(chatboxContainer)

      setLoading(false)

      return () => {
        session.destroy()
      }
    })
  }, [user, matchInfo, chatboxContainer, userId, conversationId])

  const loadMatchInfo = async () => {
    try {
      const response = await fetch(`/api/skill-exchange/match/${matchId}`)
      const data = await response.json()
      setMatchInfo(data.match)
    } catch (error) {
      console.error('Error loading match info:', error)
    }
  }

  if (loading && !matchInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex items-center justify-center">
        <div className="text-2xl font-bold text-white">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1e] to-black flex flex-col">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-white/20 bg-white/10 rounded font-bold text-gray-300 hover:bg-white/20 transition"
              >
                ← Back
              </button>
              {matchInfo && (
                <div className="flex items-center gap-3">
                  <img
                    src={matchInfo.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={matchInfo.name}
                    className="w-12 h-12 rounded-full border-2 border-white/20"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-white">{matchInfo.name}</h1>
                    <p className="text-sm text-gray-400">
                      {isOnline(matchInfo.user_id) ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Online now
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          Offline
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push(`/dashboard/skill-exchange/video/${matchId}`)}
              className="px-6 py-2 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded font-bold text-white hover:shadow-lg hover:shadow-[#3B82F6]/50 transition"
            >
              📹 Start Video Call
            </button>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-lg h-[calc(100vh-200px)] shadow-2xl overflow-hidden">
          <div 
            ref={setChatboxContainer} 
            className="w-full h-full rounded-lg overflow-hidden"
            style={{ minHeight: '500px' }}
          />
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-xl font-bold text-white">Loading chat...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
