'use client'

import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { Bell, Check, CheckCheck } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useRealtimeNotifications()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFEF7] flex items-center justify-center">
        <div className="text-xl font-bold">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFEF7]">
      {/* Header */}
      <header className="bg-white shadow border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">🔔 Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-[#B4F481] text-black font-bold rounded border-2 border-black hover:bg-green-400 transition"
              >
                <CheckCheck className="w-5 h-5 inline mr-2" />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {notifications.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-lg p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-black mb-2">No notifications yet</h2>
            <p className="text-gray-600">
              When you get notifications, they'll show up here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white border-2 border-black rounded-lg p-6 transition ${
                  !notification.read ? 'bg-blue-50 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2" />
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-black mb-2">
                      {notification.title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-700 mb-3">{notification.message}</p>

                    {/* Time */}
                    <p className="text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>

                    {/* Action button */}
                    {notification.action_url && (
                      <Link
                        href={notification.action_url}
                        onClick={() => markAsRead(notification.id)}
                        className="inline-block mt-3 px-4 py-2 bg-[#FCFF52] text-black font-bold rounded border-2 border-black hover:bg-yellow-300 transition"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>

                  {/* Mark as read button */}
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Mark as read"
                    >
                      <Check className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
