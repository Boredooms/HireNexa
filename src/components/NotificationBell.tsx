'use client'

import { useState } from 'react'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { Bell } from 'lucide-react'
import Link from 'next/link'

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const handleNotificationClick = (notificationId: string, actionUrl?: string) => {
    markAsRead(notificationId)
    if (actionUrl) {
      window.location.href = actionUrl
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell className="w-6 h-6 text-black" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white border-2 border-black rounded-lg shadow-lg z-50 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b-2 border-black bg-[#FCFF52]">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">🔔 Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm font-bold text-blue-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">{unreadCount} unread</p>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() =>
                        handleNotificationClick(notification.id, notification.action_url)
                      }
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h4 className="font-bold text-sm text-black mb-1">
                            {notification.title}
                          </h4>

                          {/* Message */}
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {notification.message}
                          </p>

                          {/* Time */}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t-2 border-black bg-gray-50">
                <Link
                  href="/dashboard/notifications"
                  className="block text-center text-sm font-bold text-blue-600 hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
