/**
 * Real-time Notification Service
 * Uses Supabase Realtime for live notifications
 */

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  action_url?: string
  read: boolean
  created_at: string
}

export class NotificationService {
  private supabase = createClient()
  private channel: RealtimeChannel | null = null

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    this.channel = this.supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()

    return this.channel
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribe() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
    }
  }

  /**
   * Create a notification
   */
  async createNotification(notification: {
    user_id: string
    type: string
    title: string
    message: string
    action_url?: string
    related_job_id?: string
    related_application_id?: string
    related_user_id?: string
  }): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data
  }

  /**
   * Get user's notifications
   */
  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data || []
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }

    return true
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Error getting unread count:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Send job match notification
   */
  async notifyJobMatch(
    candidateId: string,
    jobId: string,
    jobTitle: string,
    matchScore: number
  ): Promise<void> {
    await this.createNotification({
      user_id: candidateId,
      type: 'assignment_match',
      title: 'New Assignment Match!',
      message: `You are a ${matchScore}% match for ${jobTitle}`,
      action_url: `/dashboard/assignments/${jobId}`,
      related_job_id: jobId,
    })
  }

  /**
   * Send application status notification
   */
  async notifyApplicationStatus(
    candidateId: string,
    applicationId: string,
    jobTitle: string,
    status: string
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      reviewing: 'Your application is being reviewed',
      shortlisted: 'You have been shortlisted!',
      interviewing: 'Interview scheduled',
      offered: 'Job offer received!',
      accepted: 'Congratulations! Offer accepted',
      rejected: 'Application not selected',
    }

    await this.createNotification({
      user_id: candidateId,
      type: 'application_status',
      title: `Application Update: ${jobTitle}`,
      message: statusMessages[status] || 'Application status updated',
      action_url: `/dashboard/applications/${applicationId}`,
      related_application_id: applicationId,
    })
  }
}

export const notificationService = new NotificationService()
