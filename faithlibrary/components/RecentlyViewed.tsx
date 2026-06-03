// components/RecentlyViewed.tsx — server component, no event handlers
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Clock, Music2, ArrowRight } from 'lucide-react'

export async function RecentlyViewed({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('recently_viewed')
    .select('viewed_at, files(id, title, tags, download_count)')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(8)

  const files = (data ?? [])
    .map((r: any) => ({ ...r.files, viewed_at: r.viewed_at }))
    .filter(Boolean)

  if (files.length === 0) return null

  const timeAgo = (dateStr: string) => {
    const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (m < 60) return `${m}m ago`
    if (m < 1440) return `${Math.floor(m / 60)}h ago`
    return `${Math.floor(m / 1440)}d ago`
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(62,39,35,0.06), 0 4px 16px rgba(62,39,35,0.08)' }}>

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#EFE9E7] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#8D6E63]" />
          <h2 className="font-display text-base font-semibold text-[#3E2723]">
            Recently Viewed
          </h2>
        </div>
        <Link href="/browse"
          className="flex items-center gap-1 text-xs text-[#8D6E63] hover:text-[#5D4037] transition-colors">
          Browse all <ArrowRight size={11} />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-[#EFE9E7] sm:divide-y-0 sm:divide-x">
        {files.map((file: any) => (
          <Link key={file.id} href={`/view/${file.id}`}
            className="flex items-start gap-3 p-4 hover:bg-[#F5F5F5] transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-[#EFE9E7] flex items-center justify-center text-[#8D6E63] flex-shrink-0">
              <Music2 size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#3E2723] line-clamp-2 leading-snug group-hover:text-[#5D4037] transition-colors">
                {file.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {file.tags?.[0] && (
                  <span className="text-xs text-[#8D6E63] truncate">{file.tags[0]}</span>
                )}
                <span className="text-xs text-[#C4B5AF] flex-shrink-0">
                  {timeAgo(file.viewed_at)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}