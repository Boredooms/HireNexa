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

      // Create chatbox
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
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
        <div className="text-2xl font-bold">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-2 border-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border-2 border-black rounded font-bold hover:bg-gray-100 transition"
              >
                ← Back
              </button>
              {matchInfo && (
                <div className="flex items-center gap-3">
                  <img
                    src={matchInfo.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={matchInfo.name}
                    className="w-12 h-12 rounded-full border-2 border-black"
                  />
                  <div>
                    <h1 className="text-xl font-bold">{matchInfo.name}</h1>
                    <p className="text-sm text-gray-600">
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
              className="px-6 py-2 bg-[#FCFF52] border-2 border-black rounded font-bold hover:bg-yellow-300 transition"
            >
              📹 Start Video Call
            </button>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4">
        <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-[calc(100vh-200px)]">
          <div 
            ref={setChatboxContainer} 
            className="w-full h-full"
            style={{ minHeight: '500px' }}
          />
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-xl font-bold">Loading chat...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
