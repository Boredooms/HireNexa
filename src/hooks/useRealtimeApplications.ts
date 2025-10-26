'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Application {
  id: string
  job_id: string
  candidate_id: string
  cover_letter?: string
  portfolio_url?: string
  expected_salary?: number
  ai_match_score?: number
  status: string
  applied_at: string
  job?: {
    title: string
    company_name: string
  }
  candidate?: {
    full_name?: string
    email?: string
    avatar_url?: string
  }
}

export function useRealtimeApplications(jobId?: string) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      try {
        // Initial fetch
        let query = supabase
          .from('applications')
          .select(`
            *,
            job:jobs(title, company_name),
            candidate:users!applications_candidate_id_fkey(full_name, email, avatar_url)
          `)
          .order('applied_at', { ascending: false })

        if (jobId) {
          query = query.eq('job_id', jobId)
        }

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError
        setApplications(data || [])
        setLoading(false)

        // Subscribe to real-time changes
        const channelName = jobId ? `applications-${jobId}` : 'applications-all'
        channel = supabase.channel(channelName)

        const config: any = {
          event: 'INSERT',
          schema: 'public',
          table: 'applications',
        }

        if (jobId) {
          config.filter = `job_id=eq.${jobId}`
        }

        channel
          .on('postgres_changes', config, (payload) => {
            console.log('🆕 New application:', payload.new)
            setApplications((prev) => [payload.new as Application, ...prev])

            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Job Application!', {
                body: 'A candidate has applied for your job',
                icon: '/logo.png',
              })
            }
          })
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'applications',
            },
            (payload) => {
              console.log('📝 Application updated:', payload.new)
              setApplications((prev) =>
                prev.map((app) => (app.id === payload.new.id ? (payload.new as Application) : app))
              )
            }
          )
          .subscribe((status) => {
            console.log('📡 Applications subscription status:', status)
          })
      } catch (err: any) {
        console.error('Error setting up realtime applications:', err)
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
  }, [jobId])

  return { applications, loading, error }
}
