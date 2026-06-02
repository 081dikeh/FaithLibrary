// components/CommentSection.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send, Trash2, Loader2, User } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: string
  body: string
  created_at: string
  user_id: string
  author?: string | null
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
    // Step 1: fetch raw comments (no join — avoids 400 when FK not set in PostgREST)
    const { data: rows, error } = await supabase
      .from('comments')
      .select('id, body, created_at, user_id')
      .eq('file_id', fileId)
      .order('created_at', { ascending: true })

    if (error || !rows) { setComments([]); return }

    // Step 2: fetch display names for unique user_ids
    const ids = [...new Set(rows.map(r => r.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ids)

    const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]))

    setComments(rows.map(r => ({ ...r, author: nameMap[r.user_id] ?? null })))
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      await fetchComments()
      setLoading(false)

      if (channelRef.current) supabase.removeChannel(channelRef.current)
      const ch = supabase.channel(`comments-${fileId}`)
      channelRef.current = ch
      ch.on('postgres_changes', {
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

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const initials = (name: string | null | undefined) =>
    name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : null

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 16,
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <MessageCircle size={15} style={{ color: 'var(--walnut)' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Discussion
        </h3>
        {comments.length > 0 && (
          <span style={{
            marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)',
            background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 99,
          }}>{comments.length}</span>
        )}
      </div>

      {/* Comments list */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 size={18} style={{ color: 'var(--ochre)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : comments.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <MessageCircle size={24} style={{ color: 'var(--border)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
              No comments yet. Be the first!
            </p>
          </div>
        ) : (
          comments.map((comment, i) => (
            <div key={comment.id} style={{
              padding: '14px 20px',
              display: 'flex', alignItems: 'flex-start', gap: 12,
              borderBottom: i < comments.length - 1 ? '1px solid var(--border)' : 'none',
            }}
              className="comment-row"
            >
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'var(--surface-3)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--walnut)', fontSize: '0.7rem', fontWeight: 700,
              }}>
                {initials(comment.author) ?? <User size={13} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
                    {comment.author ?? 'Anonymous'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {fmt(comment.created_at)}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.875rem', color: 'var(--text-secondary)',
                  lineHeight: 1.55, fontFamily: 'var(--font-ui)',
                }}>{comment.body}</p>
              </div>

              {userId === comment.user_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  style={{
                    padding: 4, borderRadius: 6,
                    background: 'transparent', border: 'none',
                    color: 'var(--border-strong)', cursor: 'pointer',
                    transition: 'color 0.15s',
                    opacity: 0, // shown via CSS on hover of .comment-row
                  }}
                  className="comment-delete"
                >
                  {deletingId === comment.id
                    ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Trash2 size={13} />}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Compose */}
      <div style={{
        padding: '14px 20px',
        background: 'var(--surface-2)',
      }}>
        {userId ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <textarea
              ref={textaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost() }}
              placeholder="Add a comment… (Ctrl+Enter to post)"
              rows={2}
              maxLength={1000}
              style={{
                flex: 1, resize: 'none',
                fontFamily: 'var(--font-ui)', fontSize: '0.875rem',
                color: 'var(--text-primary)',
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: '10px 12px',
                outline: 'none', transition: 'border-color 0.18s, box-shadow 0.18s',
                minHeight: 60, lineHeight: 1.5,
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--walnut)'
                e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border)'
                e.target.style.boxShadow = 'none'
              }}
            />
            <button
              onClick={handlePost}
              disabled={posting || !body.trim()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--walnut)', color: 'var(--bone)',
                border: 'none', cursor: 'pointer',
                opacity: posting || !body.trim() ? 0.4 : 1,
                transition: 'all 0.18s', alignSelf: 'flex-end',
              }}
            >
              {posting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
            </button>
          </div>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-ui)' }}>
            <Link href="/login" style={{ color: 'var(--walnut)', fontWeight: 500 }}>Log in</Link>
            {' '}to join the discussion.
          </p>
        )}
        {body.length > 800 && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
            {body.length}/1000
          </p>
        )}
      </div>

      <style>{`
        .comment-row:hover .comment-delete { opacity: 1 !important; }
        .comment-delete:hover { color: #dc2626 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}