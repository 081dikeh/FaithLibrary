// components/NotificationBell.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCheck, MessageCircle, Music2, Info, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string; type: string; title: string
  body: string | null; link: string | null
  is_read: boolean; created_at: string
}

const ICONS: Record<string, React.ReactNode> = {
  comment:           <MessageCircle size={14} className="text-[#5D4037]" />,
  request_fulfilled: <CheckCheck    size={14} className="text-green-500" />,
  new_score:         <Music2        size={14} className="text-[#8D6E63]" />,
  system:            <Info          size={14} className="text-[#8D6E63]" />,
}

export function NotificationBell() {
  const supabase     = createClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const channelRef   = useRef<any>(null)

  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread,        setUnread]        = useState(0)
  const [userId,        setUserId]        = useState<string | null>(null)
  const [marking,       setMarking]       = useState(false)

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
      // getSession() reads localStorage — no navigator lock acquired
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const uid = session.user.id
      setUserId(uid)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20)

      const notifs = (data ?? []) as Notification[]
      setNotifications(notifs)
      setUnread(notifs.filter(n => !n.is_read).length)

      if (channelRef.current) supabase.removeChannel(channelRef.current)
      const channel = supabase.channel(`notifs-${uid}`)
      channelRef.current = channel
      channel
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${uid}`,
        }, payload => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          setUnread(c => c + 1)
        })
        .subscribe()
    }
    load()
    return () => {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
    }
  }, [])

  const markAllRead = async () => {
    if (unread === 0) return
    setMarking(true)
    await supabase.rpc('mark_all_notifications_read')
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
    setMarking(false)
  }

  const fmt = (d: string) => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  if (!userId) return null

  return (
    <div ref={containerRef} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="relative btn-icon text-[#D7CCC8] hover:text-white hover:bg-[#5D4037]/60"
        style={{ borderRadius: '10px', padding: '0.45rem' }} aria-label="Notifications">
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[0.6rem] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-white border border-[#D7CCC8] rounded-2xl shadow-[0_8px_32px_rgba(62,39,35,0.18)] animate-scale-in overflow-hidden"
          style={{ maxHeight: '440px', display: 'flex', flexDirection: 'column' }}>
          <div className="px-4 py-3 border-b border-[#EFE9E7] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#5D4037]" />
              <span className="font-display text-sm font-semibold text-[#3E2723]">Notifications</span>
              {unread > 0 && <span className="badge badge-walnut">{unread} new</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} disabled={marking}
                className="text-xs text-[#8D6E63] hover:text-[#5D4037] font-medium transition-colors flex items-center gap-1">
                {marking ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={12} />}
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Bell size={24} className="text-[#D7CCC8]" />
                <p className="text-sm text-[#8D6E63]">No notifications yet</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-[#EFE9E7] last:border-0 ${!n.is_read ? 'bg-[#EFE9E7]/40' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-[#EFE9E7] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {ICONS[n.type] ?? ICONS.system}
                </div>
                <div className="flex-1 min-w-0">
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)}
                      className="text-sm font-medium text-[#3E2723] hover:text-[#5D4037] transition-colors leading-snug block"
                      style={{ fontFamily: 'var(--font-ui)' }}>
                      {n.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-[#3E2723] leading-snug" style={{ fontFamily: 'var(--font-ui)' }}>{n.title}</p>
                  )}
                  {n.body && <p className="text-xs text-[#8D6E63] mt-0.5 line-clamp-2" style={{ fontFamily: 'var(--font-ui)' }}>{n.body}</p>}
                  <p className="text-xs text-[#D7CCC8] mt-1">{fmt(n.created_at)}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#5D4037] flex-shrink-0 mt-2" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}