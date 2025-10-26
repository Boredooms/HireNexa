import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Message {
  id: string
  sender_id: string
  sender_name: string
  message: string
  timestamp: string
  type: 'text' | 'barter-proposal' | 'barter-accepted'
}

/**
 * REAL-TIME HOOK - Listens to new messages via Supabase Realtime
 * This is NOT fake - it actually subscribes to database changes
 */
export function useRealtimeMessages(matchId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load initial messages
    loadMessages()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'skill_exchange_messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('🔴 REAL-TIME MESSAGE RECEIVED:', payload.new)
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
      })

    // Cleanup
    return () => {
      console.log('🔌 Unsubscribing from realtime channel')
      supabase.removeChannel(channel)
    }
  }, [matchId])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('skill_exchange_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  return { messages, loading }
}
