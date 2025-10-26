'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  action_url?: string
  read: boolean
  created_at: string
  data?: any
}

export function useRealtimeNotifications() {
  const { userId } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    let channel: RealtimeChannel

    const setupRealtimeSubscription = async () => {
      try {
        // Initial fetch
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (fetchError) throw fetchError
        setNotifications(data || [])
        setUnreadCount(data?.filter((n) => !n.read).length || 0)
        setLoading(false)

        // Subscribe to real-time changes
        channel = supabase
          .channel(`notifications-${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('🔔 New notification:', payload.new)
              const newNotification = payload.new as Notification
              
              setNotifications((prev) => [newNotification, ...prev])
              setUnreadCount((prev) => prev + 1)

              // Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/logo.png',
                  badge: '/logo.png',
                  tag: newNotification.id,
                })

                notification.onclick = () => {
                  if (newNotification.action_url) {
                    window.location.href = newNotification.action_url
                  }
                  notification.close()
                }
              }

              // Play notification sound
              const audio = new Audio('/notification.mp3')
              audio.play().catch(() => {
                // Ignore if sound fails
              })
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('📝 Notification updated:', payload.new)
              const updated = payload.new as Notification
              
              setNotifications((prev) =>
                prev.map((n) => (n.id === updated.id ? updated : n))
              )
              
              // Update unread count
              setUnreadCount((prev) => {
                const oldNotification = notifications.find((n) => n.id === updated.id)
                if (oldNotification && !oldNotification.read && updated.read) {
                  return Math.max(0, prev - 1)
                }
                return prev
              })
            }
          )
          .subscribe((status) => {
            console.log('📡 Notifications subscription status:', status)
          })
      } catch (err: any) {
        console.error('Error setting up realtime notifications:', err)
        setLoading(false)
      }
    }

    setupRealtimeSubscription()

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId])

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  }
}
