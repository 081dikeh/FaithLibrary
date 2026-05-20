// components/NotificationBell.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, CheckCheck, MessageCircle, Star, Music2, Info } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id:         string
  type:       string
  title:      string
  body:       string | null
  link:       string | null
  is_read:    boolean
  created_at: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  comment:            <MessageCircle size={14} className="text-[#5D4037]" />,
  request_fulfilled:  <CheckCheck size={14} className="text-green-500" />,
  new_score:          <Music2 size={14} className="text-[#8D6E63]" />,
  system:             <Info size={14} className="text-[#8D6E63]" />,
}

export function NotificationBell() {
  const supabase     = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

  const [open,           setOpen]          = useState(false)
  const [notifications,  setNotifications] = useState<Notification[]>([])
  const [unreadCount,    setUnreadCount]   = useState(0)
  const [userId,         setUserId]        = useState<string | null>(null)
  const [markingRead,    setMarkingRead]   = useState(false)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const notifs = (data ?? []) as Notification[]
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.is_read).length)

      // Real-time updates
      supabase
        .channel(`notifications:${user.id}`)
        .on('postgres_changes', {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${user.id}`,
        }, payload => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          setUnreadCount(c => c + 1)
        })
        .subscribe()
    }
    load()
  }, [])

  const markAllRead = async () => {
    if (unreadCount === 0) return
    setMarkingRead(true)
    await supabase.rpc('mark_all_notifications_read')
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    setMarkingRead(false)
  }

  if (!userId) return null

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative btn-icon text-[#D7CCC8] hover:text-white
                   hover:bg-[#5D4037]/60"
        style={{ borderRadius: '10px', padding: '0.45rem' }}
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full
                           bg-red-500 text-white text-[0.6rem] font-bold
                           flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50
                        bg-white border border-[#D7CCC8] rounded-2xl
                        shadow-[0_8px_32px_rgba(62,39,35,0.18)]
                        animate-scale-in overflow-hidden"
          style={{ maxHeight: '440px', display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#EFE9E7] flex items-center
                          justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#5D4037]" />
              <span className="font-display text-sm font-semibold text-[#3E2723]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="badge badge-walnut">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingRead}
                className="text-xs text-[#8D6E63] hover:text-[#5D4037] font-medium
                           transition-colors flex items-center gap-1"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Bell size={24} className="text-[#D7CCC8]" />
                <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[#EFE9E7]
                              last:border-0 transition-colors ${
                    notif.is_read ? '' : 'bg-[#EFE9E7]/40'
                  }`}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-full bg-[#EFE9E7] flex items-center
                                  justify-center flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[notif.type] ?? TYPE_ICONS.system}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {notif.link ? (
                      <Link
                        href={notif.link}
                        onClick={() => setOpen(false)}
                        className="text-sm font-medium text-[#3E2723] hover:text-[#5D4037]
                                   transition-colors leading-snug block"
                        style={{ fontFamily: 'var(--font-ui)' }}
                      >
                        {notif.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-[#3E2723] leading-snug"
                        style={{ fontFamily: 'var(--font-ui)' }}>
                        {notif.title}
                      </p>
                    )}
                    {notif.body && (
                      <p className="text-xs text-[#8D6E63] mt-0.5 line-clamp-2"
                        style={{ fontFamily: 'var(--font-ui)' }}>
                        {notif.body}
                      </p>
                    )}
                    <p className="text-xs text-[#D7CCC8] mt-1">
                      {formatDate(notif.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[#5D4037] flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}