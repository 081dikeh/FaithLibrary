// components/CommentSection.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send, Trash2, Loader2, User } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id:         string
  body:       string
  created_at: string
  user_id:    string
  profiles:   { full_name: string | null } | null
}

interface CommentSectionProps {
  fileId: string
}

export function CommentSection({ fileId }: CommentSectionProps) {
  const supabase  = createClient()
  const textaRef  = useRef<HTMLTextAreaElement>(null)

  const [comments,  setComments]  = useState<Comment[]>([])
  const [loading,   setLoading]   = useState(true)
  const [body,      setBody]      = useState('')
  const [posting,   setPosting]   = useState(false)
  const [userId,    setUserId]    = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data } = await supabase
        .from('comments')
        .select('*, profiles(full_name)')
        .eq('file_id', fileId)
        .order('created_at', { ascending: true })

      setComments((data as Comment[]) ?? [])
      setLoading(false)
    }
    load()

    // Real-time subscription
    const channel = supabase
      .channel(`comments:${fileId}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'comments',
        filter: `file_id=eq.${fileId}`,
      }, async () => {
        const { data } = await supabase
          .from('comments')
          .select('*, profiles(full_name)')
          .eq('file_id', fileId)
          .order('created_at', { ascending: true })
        setComments((data as Comment[]) ?? [])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fileId])

  const handlePost = async () => {
    if (!body.trim() || !userId) return
    setPosting(true)

    const { error } = await supabase.from('comments').insert({
      file_id: fileId,
      user_id: userId,
      body:    body.trim(),
    })

    if (!error) {
      setBody('')
      textaRef.current?.focus()
    }
    setPosting(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await supabase.from('comments').delete().eq('id', id)
    setDeletingId(null)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })

  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#EFE9E7] flex items-center gap-2">
        <MessageCircle size={15} className="text-[#5D4037]" />
        <h3 className="font-display text-base font-semibold text-[#3E2723]">
          Discussion
        </h3>
        {comments.length > 0 && (
          <span className="ml-auto text-xs text-[#8D6E63] bg-[#EFE9E7]
                           px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      {/* Comments list */}
      <div className="divide-y divide-[#EFE9E7]">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="animate-spin text-[#8D6E63]" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle size={24} className="text-[#D7CCC8] mx-auto mb-2" />
            <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
              No comments yet. Be the first!
            </p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="px-5 py-4 flex items-start gap-3 group">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#EFE9E7] flex items-center
                              justify-center text-[#5D4037] text-xs font-bold flex-shrink-0">
                {comment.profiles?.full_name
                  ? comment.profiles.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : <User size={13} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#3E2723]"
                    style={{ fontFamily: 'var(--font-ui)' }}>
                    {comment.profiles?.full_name ?? 'Anonymous'}
                  </span>
                  <span className="text-xs text-[#D7CCC8]">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-[#5D4037] mt-1 leading-relaxed"
                  style={{ fontFamily: 'var(--font-ui)' }}>
                  {comment.body}
                </p>
              </div>

              {/* Delete — own comments only */}
              {userId === comment.user_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="opacity-0 group-hover:opacity-100 btn-icon text-[#D7CCC8]
                             hover:text-red-400 flex-shrink-0 transition-all"
                  style={{ padding: '0.25rem' }}
                >
                  {deletingId === comment.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Trash2 size={13} />}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Compose */}
      <div className="px-5 py-4 border-t border-[#EFE9E7] bg-[#F5F5F5]">
        {userId ? (
          <div className="flex items-end gap-2">
            <textarea
              ref={textaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
              }}
              placeholder="Add a comment… (Ctrl+Enter to post)"
              rows={2}
              maxLength={1000}
              className="input flex-1 resize-none text-sm"
              style={{ minHeight: '60px' }}
            />
            <button
              onClick={handlePost}
              disabled={posting || !body.trim()}
              className="btn btn-primary flex-shrink-0"
              style={{ padding: '0.6rem 0.875rem', alignSelf: 'flex-end' }}
            >
              {posting
                ? <Loader2 size={15} className="animate-spin" />
                : <Send size={15} />}
            </button>
          </div>
        ) : (
          <p className="text-sm text-[#8D6E63] text-center" style={{ fontFamily: 'var(--font-ui)' }}>
            <Link href="/login" className="text-[#5D4037] font-medium hover:underline">
              Log in
            </Link>{' '}
            to join the discussion.
          </p>
        )}
        {body.length > 800 && (
          <p className="text-xs text-[#8D6E63] mt-1 text-right">
            {body.length}/1000
          </p>
        )}
      </div>
    </div>
  )
}