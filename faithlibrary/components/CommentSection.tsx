// components/CommentSection.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send, Trash2, Loader2, User } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: string; body: string; created_at: string; user_id: string
  authorName?: string | null
}

export function CommentSection({ fileId }: { fileId: string }) {
  const supabase   = createClient()
  const textaRef   = useRef<HTMLTextAreaElement>(null)
  const channelRef = useRef<any>(null)

  const [comments,   setComments]   = useState<Comment[]>([])
  const [loading,    setLoading]    = useState(true)
  const [body,       setBody]       = useState('')
  const [posting,    setPosting]    = useState(false)
  const [userId,     setUserId]     = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchComments = async () => {
    // No join on profiles — avoids the 400 error from missing FK in PostgREST schema
    const { data: rows } = await supabase
      .from('comments')
      .select('id, body, created_at, user_id')
      .eq('file_id', fileId)
      .order('created_at', { ascending: true })

    if (!rows || rows.length === 0) { setComments([]); return }

    // Fetch display names separately
    const ids = [...new Set(rows.map((r: any) => r.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ids)

    const nameMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.full_name]))
    setComments(rows.map((r: any) => ({ ...r, authorName: nameMap[r.user_id] ?? null })))
  }

  useEffect(() => {
    const init = async () => {
      // getSession — no lock acquired
      const { data: { session } } = await supabase.auth.getSession()
      setUserId(session?.user?.id ?? null)
      await fetchComments()
      setLoading(false)

      if (channelRef.current) supabase.removeChannel(channelRef.current)
      const channel = supabase.channel(`comments-${fileId}`)
      channelRef.current = channel
      channel.on('postgres_changes', {
        event: '*', schema: 'public', table: 'comments',
        filter: `file_id=eq.${fileId}`,
      }, () => fetchComments()).subscribe()
    }
    init()
    return () => {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
    }
  }, [fileId])

  const handlePost = async () => {
    if (!body.trim() || !userId) return
    setPosting(true)
    await supabase.from('comments').insert({ file_id: fileId, user_id: userId, body: body.trim() })
    setBody('')
    setPosting(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await supabase.from('comments').delete().eq('id', id)
    setDeletingId(null)
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const initials = (name: string | null | undefined) =>
    name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : null

  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(62,39,35,0.06), 0 4px 16px rgba(62,39,35,0.08)' }}>
      <div className="px-5 py-4 border-b border-[#EFE9E7] flex items-center gap-2">
        <MessageCircle size={15} className="text-[#5D4037]" />
        <h3 className="font-display text-base font-semibold text-[#3E2723]">Discussion</h3>
        {comments.length > 0 && (
          <span className="ml-auto text-xs text-[#8D6E63] bg-[#EFE9E7] px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      <div className="divide-y divide-[#EFE9E7]">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="animate-spin text-[#8D6E63]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle size={24} className="text-[#D7CCC8] mx-auto mb-2" />
            <p className="text-sm text-[#8D6E63]">No comments yet. Be the first!</p>
          </div>
        ) : comments.map(comment => (
          <div key={comment.id} className="px-5 py-4 flex items-start gap-3 group">
            <div className="w-8 h-8 rounded-full bg-[#EFE9E7] flex items-center justify-center text-[#5D4037] text-xs font-bold flex-shrink-0">
              {initials(comment.authorName) ?? <User size={13} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[#3E2723]" style={{ fontFamily: 'var(--font-ui)' }}>
                  {comment.authorName ?? 'Anonymous'}
                </span>
                <span className="text-xs text-[#D7CCC8]">{fmt(comment.created_at)}</span>
              </div>
              <p className="text-sm text-[#5D4037] mt-1 leading-relaxed" style={{ fontFamily: 'var(--font-ui)' }}>
                {comment.body}
              </p>
            </div>
            {userId === comment.user_id && (
              <button onClick={() => handleDelete(comment.id)} disabled={deletingId === comment.id}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#D7CCC8] hover:text-red-400 flex-shrink-0 transition-all">
                {deletingId === comment.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-[#EFE9E7] bg-[#F5F5F5]">
        {userId ? (
          <div className="flex items-end gap-2">
            <textarea ref={textaRef} value={body} onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost() }}
              placeholder="Add a comment… (Ctrl+Enter to post)"
              rows={2} maxLength={1000}
              className="flex-1 resize-none text-sm bg-white border border-[#D7CCC8] rounded-xl px-3 py-2.5 outline-none focus:border-[#5D4037] focus:ring-2 focus:ring-[#5D4037]/10 transition-all"
              style={{ minHeight: '60px', fontFamily: 'var(--font-ui)' }} />
            <button onClick={handlePost} disabled={posting || !body.trim()}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-[#5D4037] text-white text-sm font-medium hover:bg-[#3E2723] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ alignSelf: 'flex-end' }}>
              {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        ) : (
          <p className="text-sm text-[#8D6E63] text-center">
            <Link href="/login" className="text-[#5D4037] font-medium hover:underline">Log in</Link>
            {' '}to join the discussion.
          </p>
        )}
        {body.length > 800 && <p className="text-xs text-[#8D6E63] mt-1 text-right">{body.length}/1000</p>}
      </div>
    </div>
  )
}