/**
 * Notifications dropdown — bell icon in the dashboard header.
 *
 * State of play: the real notifications backend (per-owner notification
 * collection, fan-out from check-ins / messages / announcements / staff
 * clock-in events) hasn't been built yet. Until it lands, this dropdown:
 *
 *   - Renders an empty list with a friendly "You're all caught up" empty
 *     state, instead of dummy "Liam Chen checked in" / "Sarah Mitchell
 *     clocked in" rows that would mislead a real owner about whether
 *     their center is actually active.
 *   - Suppresses the unread red badge on the bell entirely (the badge
 *     was previously hardcoded to 2 from the mock array).
 *
 * When the real notifications system is wired in (Track G — `notifications/`
 * collection scoped to `daycareId`), replace the empty `[]` below with
 * the live snapshot subscription and the badge logic will start working
 * automatically (it already keys off `unreadCount`).
 */
import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, MessageSquare, AlertTriangle, Calendar, Users, CheckCircle } from 'lucide-react';

// Type → icon mapping kept ready for when the real notifications snapshot
// hydrates this list. Empty `notifications` state means none of these
// render today; this is a future-proofing convenience for the next PR.
const TYPE_ICONS = {
  message: MessageSquare,
  checkin: CheckCircle,
  alert: AlertTriangle,
  event: Calendar,
  staff: Users,
};

const typeColors = {
  message: 'bg-brand-100 text-brand-600',
  checkin: 'bg-success-100 text-success-600',
  alert: 'bg-warning-100 text-warning-600',
  event: 'bg-info-100 text-info-600',
  staff: 'bg-accent-100 text-accent-600',
};

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  // Live notifications subscription goes here. Until then we render an
  // honest empty state instead of dummy fixtures.
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-surface-100 text-surface-600 hover:text-surface-900 transition-colors"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-soft-xl border border-surface-100 overflow-hidden z-50 animate-scale-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-surface-900">Notifications</h3>
              {unreadCount > 0 ? (
                <p className="text-xs text-surface-500">{unreadCount} unread</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const Icon = TYPE_ICONS[notification.type] || Bell;
                return (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-surface-50 transition-colors border-b border-surface-50 last:border-0 ${
                      !notification.read ? 'bg-brand-50/30' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          typeColors[notification.type] ||
                          'bg-surface-100 text-surface-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-surface-900`}>
                              {notification.title}
                            </p>
                            {notification.description && (
                              <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">
                                {notification.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-1 hover:bg-surface-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-surface-400" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {notification.time && (
                            <span className="text-xs text-surface-400">
                              {notification.time}
                            </span>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-brand-600 hover:text-brand-700"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 px-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-surface-400" />
                </div>
                <p className="text-sm font-medium text-surface-700">
                  You're all caught up
                </p>
                <p className="text-xs text-surface-500 mt-1">
                  Notifications about check-ins, messages, and staff
                  activity will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-surface-100 bg-surface-50">
              <button
                onClick={clearAll}
                className="w-full text-center text-sm text-surface-600 hover:text-surface-900"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
