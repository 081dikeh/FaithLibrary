// components/RequestList.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronUp, MessageSquarePlus, CheckCircle2, Clock } from 'lucide-react'

interface Request {
  id:          string
  title:       string
  description: string | null
  tags:        string[]
  upvotes:     number
  status:      string
  created_at:  string
  profiles?:   { full_name: string | null }
}

interface RequestListProps {
  requests:    Request[]
  userUpvotes: string[]
  isLoggedIn:  boolean
}

export function RequestList({ requests, userUpvotes, isLoggedIn }: RequestListProps) {
  const supabase = createClient()
  const [upvotes, setUpvotes] = useState<Record<string, number>>(
    Object.fromEntries(requests.map(r => [r.id, r.upvotes]))
  )
  const [voted, setVoted] = useState<Set<string>>(new Set(userUpvotes))
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpvote = async (requestId: string) => {
    if (!isLoggedIn) { window.location.href = '/login'; return }
    setLoading(requestId)

    const { data } = await supabase.rpc('toggle_request_upvote', { p_request_id: requestId })

    if (data?.action === 'added') {
      setUpvotes(prev => ({ ...prev, [requestId]: (prev[requestId] ?? 0) + 1 }))
      setVoted(prev => new Set([...prev, requestId]))
    } else {
      setUpvotes(prev => ({ ...prev, [requestId]: Math.max(0, (prev[requestId] ?? 0) - 1) }))
      setVoted(prev => { const s = new Set(prev); s.delete(requestId); return s })
    }
    setLoading(null)
  }

  if (requests.length === 0) return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-[#EFE9E7] flex items-center
                      justify-center text-[#8D6E63]">
        <MessageSquarePlus size={28} />
      </div>
      <p className="font-display text-xl text-[#5D4037]">No requests yet</p>
      <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
        Be the first to request a score.
      </p>
    </div>
  )

  return (
    <div className="space-y-3">
      {requests.map(req => {
        const isVoted = voted.has(req.id)
        const date    = new Date(req.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })
        return (
          <div key={req.id}
            className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card
                       p-5 flex items-start gap-4">

            {/* Upvote */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleUpvote(req.id)}
                disabled={loading === req.id}
                className={`w-10 h-10 rounded-xl flex items-center justify-center
                            border-2 transition-all duration-150 ${
                  isVoted
                    ? 'bg-[#5D4037] border-[#5D4037] text-white'
                    : 'border-[#D7CCC8] text-[#8D6E63] hover:border-[#5D4037] hover:text-[#5D4037]'
                }`}
              >
                <ChevronUp size={18} />
              </button>
              <span className="text-sm font-bold text-[#3E2723]">
                {upvotes[req.id] ?? 0}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="font-display font-semibold text-[#3E2723] text-base leading-snug">
                  {req.title}
                </h3>
                <span className={`badge flex-shrink-0 ${
                  req.status === 'fulfilled' ? 'badge-walnut' : 'badge-sand'
                }`}>
                  {req.status === 'fulfilled'
                    ? <><CheckCircle2 size={9} /> Fulfilled</>
                    : <><Clock size={9} /> Open</>}
                </span>
              </div>

              {req.description && (
                <p className="text-sm text-[#8D6E63] mt-1 leading-relaxed"
                  style={{ fontFamily: 'var(--font-ui)' }}>
                  {req.description}
                </p>
              )}

              {req.tags && req.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {req.tags.map(tag => (
                    <span key={tag} className="badge badge-sand">{tag}</span>
                  ))}
                </div>
              )}

              <p className="text-xs text-[#D7CCC8] mt-2" style={{ fontFamily: 'var(--font-ui)' }}>
                {req.profiles?.full_name ?? 'Anonymous'} · {date}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}