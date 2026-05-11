// components/FeaturedScores.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Star, Download, Music2 } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

const COVER_GRADIENTS = [
  'from-[#4E342E] to-[#6D4C41]',
  'from-[#1B5E20]/80 to-[#388E3C]/60',
  'from-[#4A148C]/70 to-[#7B1FA2]/50',
  'from-[#E65100]/70 to-[#FF8F00]/50',
  'from-[#880E4F]/70 to-[#C2185B]/50',
  'from-[#01579B]/70 to-[#0288D1]/50',
]

export async function FeaturedScores() {
  const supabase = await createClient()

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('is_featured', true)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(8)

  if (!files || files.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <Star size={15} className="text-amber-400" fill="currentColor" />
        <h2 className="font-display text-xl font-semibold text-[#3E2723]">
          Featured Scores
        </h2>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6
                      scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {(files as FileRecord[]).map((file, i) => (
          <Link
            key={file.id}
            href={`/view/${file.id}`}
            className="flex-shrink-0 w-52 group"
          >
            <div className={`h-36 rounded-2xl bg-gradient-to-br
                            ${COVER_GRADIENTS[i % COVER_GRADIENTS.length]}
                            flex items-center justify-center relative
                            overflow-hidden transition-transform duration-300
                            group-hover:-translate-y-1 group-hover:shadow-lift`}>
              {/* Staff lines */}
              <div className="absolute inset-0 flex flex-col justify-center
                              gap-3 px-6 opacity-10 pointer-events-none">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-px bg-white" />
                ))}
              </div>
              <Music2 size={28} className="text-white/80 relative z-10" />

              {/* Featured badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1
                              bg-amber-400/90 text-amber-900 text-[0.6rem]
                              font-bold px-1.5 py-0.5 rounded-full">
                <Star size={8} fill="currentColor" /> Featured
              </div>
            </div>

            <div className="mt-2.5 px-0.5">
              <p className="font-display text-sm font-semibold text-[#3E2723]
                            line-clamp-2 leading-snug group-hover:text-[#5D4037]
                            transition-colors">
                {file.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {file.tags?.[0] && (
                  <span className="text-xs text-[#8D6E63] truncate">{file.tags[0]}</span>
                )}
                {(file.download_count ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-[#D7CCC8]
                                   flex-shrink-0">
                    <Download size={9} /> {file.download_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}