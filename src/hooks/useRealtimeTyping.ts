import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * REAL-TIME HOOK - Shows typing indicators
 * Broadcasts when user is typing and listens for others typing
 */
export function useRealtimeTyping(matchId: string, userId: string) {
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)

  useEffect(() => {
    // Subscribe to typing events
    const channel = supabase
      .channel(`typing:${matchId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('⌨️ REAL-TIME TYPING EVENT:', payload)
        
        // Only show if it's not the current user
        if (payload.payload.userId !== userId) {
          setOtherUserTyping(payload.payload.isTyping)
          
          // Auto-hide after 3 seconds
          if (payload.payload.isTyping) {
            setTimeout(() => setOtherUserTyping(false), 3000)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, userId])

  const broadcastTyping = async (typing: boolean) => {
    setIsTyping(typing)
    
    const channel = supabase.channel(`typing:${matchId}`)
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping: typing }
    })
    
    console.log(`📤 Broadcasted typing: ${typing}`)
  }

  return { isTyping, otherUserTyping, broadcastTyping }
}
