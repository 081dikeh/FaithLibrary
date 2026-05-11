// components/RecentlyViewed.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Clock, Music2 } from 'lucide-react'

interface RecentlyViewedProps {
  userId: string
}

export async function RecentlyViewed({ userId }: RecentlyViewedProps) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('recently_viewed')
    .select('viewed_at, files(id, title, tags, file_url, download_count)')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(8)

  const files = (data ?? [])
    .map((r: any) => ({ ...r.files, viewed_at: r.viewed_at }))
    .filter(Boolean)

  if (files.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-[#EFE9E7] flex items-center gap-2">
        <Clock size={14} className="text-[#8D6E63]" />
        <h2 className="font-display text-base font-semibold text-[#3E2723]">
          Recently Viewed
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0
                      sm:divide-x divide-[#EFE9E7]">
        {files.map((file: any) => (
          <Link key={file.id} href={`/view/${file.id}`}
            className="flex items-start gap-3 p-4 hover:bg-[#F5F5F5]
                       transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-[#EFE9E7] flex items-center
                            justify-center text-[#8D6E63] flex-shrink-0">
              <Music2 size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#3E2723] line-clamp-2 leading-snug
                            group-hover:text-[#5D4037] transition-colors"
                style={{ fontFamily: 'var(--font-ui)' }}>
                {file.title}
              </p>
              {file.tags?.[0] && (
                <p className="text-xs text-[#8D6E63] mt-0.5 truncate">
                  {file.tags[0]}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}