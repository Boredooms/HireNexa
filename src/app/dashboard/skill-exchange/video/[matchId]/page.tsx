'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'

export default function VideoCallPage() {
  const { userId } = useAuth()
  const { user } = useUser()
  const params = useParams()
  const router = useRouter()
  const matchId = params.matchId as string
  const containerRef = useRef<HTMLDivElement>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch barter ID to use as room ID
  useEffect(() => {
    const fetchBarter = async () => {
      try {
        const response = await fetch(`/api/skill-exchange/matches?filter=all`)
        const data = await response.json()
        
        // Find the match and get its barter_id
        const match = data.matches?.find((m: any) => m.id === matchId)
        
        if (match?.barter_id) {
          console.log('🎯 Using barter ID as room:', match.barter_id)
          setRoomId(match.barter_id)
        } else {
          // Fallback: use matchId
          console.log('⚠️ No barter found, using matchId as room:', matchId)
          setRoomId(matchId)
        }
      } catch (error) {
        console.error('Error fetching barter:', error)
        setRoomId(matchId) // Fallback
      } finally {
        setLoading(false)
      }
    }
    
    fetchBarter()
  }, [matchId])

  useEffect(() => {
    if (!user || !containerRef.current || !roomId) return

    const appID = parseInt(process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID!)
    const serverSecret = process.env.NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET!
    
    console.log('🔑 ZEGOCLOUD Config:', { appID, hasSecret: !!serverSecret, roomId, userId })
    
    // Generate Kit Token with barter ID as room
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomId, // ✅ Use barter ID so both users join same room!
      userId!, // user ID
      user.fullName || 'User'
    )
    
    console.log('🎫 Generated token:', kitToken ? '✅ Success' : '❌ Failed')

    // Create instance
    const zp = ZegoUIKitPrebuilt.create(kitToken)

    // Start call
    zp.joinRoom({
      container: containerRef.current,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall, // 1-on-1 call
      },
      showScreenSharingButton: true,
      showTextChat: true,
      showUserList: false,
      maxUsers: 2,
      layout: 'Auto',
      showLayoutButton: false,
      
      onJoinRoom: () => {
        console.log('✅ Joined video call room:', matchId)
      },
      
      onLeaveRoom: () => {
        console.log('👋 Left video call room')
        router.push('/dashboard/skill-exchange')
      },
      
      onUserJoin: (users: any[]) => {
        console.log('👤 User joined:', users)
      },
      
      onUserLeave: (users: any[]) => {
        console.log('👋 User left:', users)
      }
    })

    return () => {
      // Cleanup handled by ZegoCloud
    }
  }, [user, userId, roomId, router])

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading video call...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
