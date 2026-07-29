// components/SeasonalSuggestions.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CalendarHeart, Music2, ArrowRight } from 'lucide-react'
import { getLiturgicalSeason } from '@/lib/liturgicalCalendar'
import type { FileRecord } from '@/lib/types'

/**
 * Surfaces scores tagged for the current liturgical season on the homepage
 * — a director opening the site in Advent sees Advent hymns front and
 * center instead of a generic "latest uploads" feed. See lib/liturgicalCalendar.ts
 * for how "current season" is approximated.
 */
export async function SeasonalSuggestions() {
  const season = getLiturgicalSeason()
  const supabase = await createClient()

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('is_public', true)
    .contains('tags', [season])
    .order('download_count', { ascending: false, nullsFirst: false })
    .limit(8)

  if (!files || files.length === 0) return null

  return (
    <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarHeart size={16} className="text-[#8D6E63]" />
          <h2 className="font-display text-xl font-semibold text-[#3E2723]">
            For {season} Right Now
          </h2>
        </div>
        <Link
          href={`/browse?tag=${encodeURIComponent(season)}`}
          className="text-xs font-semibold text-[#8D6E63] hover:text-[#5D4037] flex items-center gap-1 flex-shrink-0"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          See all <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-none">
        {(files as FileRecord[]).map(file => (
          <Link key={file.id} href={`/view/${file.id}`}
            className="flex-shrink-0 w-36 sm:w-44 group">
            <div className="relative rounded-xl bg-gradient-to-br from-[#4E342E] to-[#6D4C41]
                            overflow-hidden transition-all duration-300
                            group-hover:-translate-y-1 group-hover:shadow-lift"
              style={{ paddingBottom: '141.4%' }}>
              <div className="absolute inset-0 flex flex-col justify-center
                              gap-[12%] px-[15%] opacity-10 pointer-events-none">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-px bg-white" />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Music2 size={24} className="text-white/70" aria-hidden="true" />
              </div>
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center gap-1 bg-[#F5F5F5]/95
                                 text-[#5D4037] text-[0.55rem] font-bold
                                 px-1.5 py-0.5 rounded-full leading-none">
                  {season}
                </span>
              </div>
            </div>

            <div className="mt-2 px-0.5">
              <p className="font-display text-xs font-semibold text-[#3E2723]
                            line-clamp-2 leading-snug
                            group-hover:text-[#5D4037] transition-colors">
                {file.title}
              </p>
              {file.composer && (
                <p className="text-[0.65rem] text-[#8D6E63] mt-0.5 truncate"
                  style={{ fontFamily: 'var(--font-ui)' }}>
                  {file.composer}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
