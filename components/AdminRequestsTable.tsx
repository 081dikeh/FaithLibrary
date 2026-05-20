// components/AdminRequestsTable.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Clock, ChevronUp, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface AdminRequestsTableProps {
  requests: any[]
}

export function AdminRequestsTable({ requests: initial }: AdminRequestsTableProps) {
  const supabase = createClient()
  const [requests, setRequests] = useState(initial)
  const [loading,  setLoading]  = useState<string | null>(null)

  const fulfill = async (req: any) => {
    setLoading(req.id)

    // Mark fulfilled
    await supabase
      .from('requests')
      .update({ status: 'fulfilled' })
      .eq('id', req.id)

    // Notify requester
    await supabase.from('notifications').insert({
      user_id: req.user_id,
      type:    'request_fulfilled',
      title:   'Your score request has been fulfilled!',
      body:    `"${req.title}" is now available in the library.`,
      link:    '/',
    })

    setRequests(prev =>
      prev.map(r => r.id === req.id ? { ...r, status: 'fulfilled' } : r)
    )
    setLoading(null)
  }

  const openRequests  = requests.filter(r => r.status === 'open')
  const closedRequests = requests.filter(r => r.status !== 'open')

  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EFE9E7] flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-[#3E2723]">
          Score Requests
        </h2>
        <div className="flex items-center gap-2 text-xs" style={{ fontFamily: 'var(--font-ui)' }}>
          <span className="badge badge-walnut">{openRequests.length} open</span>
          {closedRequests.length > 0 && (
            <span className="badge badge-sand">{closedRequests.length} fulfilled</span>
          )}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="py-12 text-center text-[#8D6E63] text-sm"
          style={{ fontFamily: 'var(--font-ui)' }}>
          No requests yet.
        </div>
      ) : (
        <div className="divide-y divide-[#EFE9E7]">
          {requests.map(req => (
            <div key={req.id}
              className={`flex items-start gap-4 px-6 py-4 ${
                req.status !== 'open' ? 'opacity-60' : ''
              }`}>
              {/* Upvotes */}
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <ChevronUp size={16} className="text-[#8D6E63]" />
                <span className="text-sm font-bold text-[#3E2723]">
                  {req.upvotes ?? 0}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className="text-sm font-semibold text-[#3E2723]"
                    style={{ fontFamily: 'var(--font-ui)' }}>
                    {req.title}
                  </h3>
                  <span className={`badge ${
                    req.status === 'fulfilled' ? 'badge-walnut' : 'badge-sand'
                  }`}>
                    {req.status === 'fulfilled'
                      ? <><CheckCircle2 size={9} /> Fulfilled</>
                      : <><Clock size={9} /> Open</>}
                  </span>
                </div>
                {req.description && (
                  <p className="text-xs text-[#8D6E63] line-clamp-1 mb-1"
                    style={{ fontFamily: 'var(--font-ui)' }}>
                    {req.description}
                  </p>
                )}
                {req.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {req.tags.slice(0, 3).map((t: string) => (
                      <span key={t} className="badge badge-sand text-[0.6rem]">{t}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-[#D7CCC8] mt-1"
                  style={{ fontFamily: 'var(--font-ui)' }}>
                  By {req.profiles?.full_name ?? 'Anonymous'} ·{' '}
                  {new Date(req.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                  })}
                </p>
              </div>

              {/* Action */}
              {req.status === 'open' && (
                <button
                  onClick={() => fulfill(req)}
                  disabled={loading === req.id}
                  className="btn btn-sm flex-shrink-0"
                  style={{
                    background: '#1B5E20', color: 'white',
                    borderColor: '#1B5E20', padding: '0.4rem 0.875rem',
                    fontSize: '0.75rem',
                  }}
                >
                  {loading === req.id
                    ? <Loader2 size={12} className="animate-spin" />
                    : <><CheckCircle2 size={12} /> Fulfill</>}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}