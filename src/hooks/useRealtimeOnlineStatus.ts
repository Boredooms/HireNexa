import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * REAL-TIME HOOK - Tracks online/offline status of users
 * Updates when users come online or go offline
 */
export function useRealtimeOnlineStatus() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load initial online users
    loadOnlineUsers()

    // Subscribe to real-time status changes
    const channel = supabase
      .channel('online-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'skill_exchange_profiles',
        },
        (payload) => {
          const profile = payload.new as any
          console.log('🟢 REAL-TIME STATUS UPDATE:', profile.user_id, profile.online)
          
          setOnlineUsers((prev) => {
            const updated = new Set(prev)
            if (profile.online) {
              updated.add(profile.user_id)
            } else {
              updated.delete(profile.user_id)
            }
            return updated
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Online status subscription:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('skill_exchange_profiles')
        .select('user_id')
        .eq('online', true)

      if (error) throw error
      
      const userIds = new Set(data?.map(u => u.user_id) || [])
      setOnlineUsers(userIds)
    } catch (error) {
      console.error('Error loading online users:', error)
    }
  }

  const setOnline = async (userId: string, online: boolean) => {
    try {
      const { error } = await supabase
        .from('skill_exchange_profiles')
        .update({ 
          online,
          last_active: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error
      console.log(`✅ Set ${userId} to ${online ? 'ONLINE' : 'OFFLINE'}`)
    } catch (error) {
      console.error('Error updating online status:', error)
    }
  }

  return { onlineUsers, setOnline }
}
