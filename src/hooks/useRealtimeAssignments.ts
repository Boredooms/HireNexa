import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useRealtimeAssignments() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial fetch
    fetchAssignments()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments'
        },
        (payload) => {
          console.log('Assignment change detected:', payload)
          fetchAssignments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error

      setAssignments(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching assignments:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { assignments, loading, error, refetch: fetchAssignments }
}
