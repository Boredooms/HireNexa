import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useRealtimePresence(userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) return

    // Create a presence channel
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId
        }
      }
    })

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = new Set<string>()
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[]
          presences.forEach((presence) => {
            if (presence.user_id) {
              users.add(presence.user_id)
            }
          })
        })
        
        setOnlineUsers(users)
        console.log('👥 Online users:', Array.from(users))
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('🟢 User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('🔴 User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as online
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString()
          })
          
          // Update database
          await supabase
            .from('skill_exchange_profiles')
            .update({
              online: true,
              last_active: new Date().toISOString()
            })
            .eq('user_id', userId)
        }
      })

    // Cleanup: mark as offline when leaving
    return () => {
      channel.untrack()
      channel.unsubscribe()
      
      // Update database
      supabase
        .from('skill_exchange_profiles')
        .update({
          online: false,
          last_active: new Date().toISOString()
        })
        .eq('user_id', userId)
        .then(() => {
          console.log('👋 Marked as offline')
        })
    }
  }, [userId])

  return {
    onlineUsers,
    isOnline: (checkUserId: string) => onlineUsers.has(checkUserId)
  }
}
