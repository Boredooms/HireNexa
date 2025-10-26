'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Verifier {
  id: string
  user_id: string
  expertise_areas: string[]
  years_experience: number
  github_profile?: string
  linkedin_profile?: string
  portfolio_url?: string
  why_verify_skills: string
  status: string
  is_authorized?: boolean
  created_at: string
  applied_at: string
}

export function useRealtimeVerifiers() {
  const [verifiers, setVerifiers] = useState<Verifier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      try {
        // Fetch via API which uses service role
        const response = await fetch('/api/admin/get-applications')
        if (!response.ok) throw new Error('Failed to fetch applications')
        
        const apiData = await response.json()
        setVerifiers(apiData.peerReviewerApplications || [])
        setLoading(false)

        // Subscribe to real-time changes
        channel = supabase
          .channel('verifiers-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'peer_reviewer_applications',
            },
            (payload) => {
              console.log('🆕 New verifier application:', payload.new)
              setVerifiers((prev) => [payload.new as Verifier, ...prev])
              
              // Show notification for admins
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Verifier Application!', {
                  body: 'A new skill verifier has applied. Review now.',
                  icon: '/logo.png',
                })
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'peer_reviewer_applications',
            },
            (payload) => {
              console.log('📝 Verifier updated:', payload.new)
              // Only show pending applications
              if (payload.new.status === 'pending') {
                setVerifiers((prev) =>
                  prev.map((v) => (v.id === payload.new.id ? (payload.new as Verifier) : v))
                )
              } else {
                // Remove if no longer pending
                setVerifiers((prev) => prev.filter((v) => v.id !== payload.new.id))
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'peer_reviewer_applications',
            },
            (payload) => {
              console.log('🗑️ Verifier deleted:', payload.old)
              setVerifiers((prev) => prev.filter((v) => v.id !== payload.old.id))
            }
          )
          .subscribe((status) => {
            console.log('📡 Verifiers subscription status:', status)
          })
      } catch (err: any) {
        console.error('Error setting up realtime:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    setupRealtimeSubscription()

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  return { verifiers, loading, error }
}
