// components/ScoreOfWeek.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Star, Music2, Download, ArrowRight } from 'lucide-react'

export async function ScoreOfWeek() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('score_of_week')
    .select('*, files(id, title, composer, arranger, voice_parts, tags, download_count, description)')
    .order('week_start', { ascending: false })
    .limit(1)
    .single()

  if (!data?.files) return null

  const file = data.files as any

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-gradient-to-br from-[#3E2723] to-[#5D4037]
                      rounded-2xl overflow-hidden shadow-lift">
        <div className="flex flex-col sm:flex-row">
          {/* Cover */}
          <div className="sm:w-52 lg:w-64 flex-shrink-0 h-48 sm:h-auto
                          bg-gradient-to-br from-[#5D4037] to-[#8D6E63]
                          flex items-center justify-center relative">
            {/* Staff lines */}
            <div className="absolute inset-0 flex flex-col justify-center
                            gap-4 px-8 opacity-10 pointer-events-none">
              {[...Array(5)].map((_, i) => <div key={i} className="h-px bg-white" />)}
            </div>
            <Music2 size={40} className="text-white/60 relative z-10" />

            {/* Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5
                            bg-amber-400 text-amber-900 text-xs font-bold
                            px-2.5 py-1 rounded-full shadow-sm">
              <Star size={10} fill="currentColor" />
              Score of the Week
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Tags */}
              {file.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {file.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag}
                      className="text-xs px-2 py-0.5 rounded-full
                                 bg-white/10 text-[#D7CCC8] border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h2 className="font-display text-2xl sm:text-3xl font-bold
                             text-[#F5F5F5] leading-snug mb-2">
                {file.title}
              </h2>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-sm text-[#D7CCC8]/80 mb-3"
                style={{ fontFamily: 'var(--font-ui)' }}>
                {file.composer   && <span>By <strong className="text-[#D7CCC8]">{file.composer}</strong></span>}
                {file.arranger   && <span>Arr. {file.arranger}</span>}
                {file.voice_parts && <span>{file.voice_parts}</span>}
                {(file.download_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-[#8D6E63]">
                    <Download size={11} /> {file.download_count} downloads
                  </span>
                )}
              </div>

              {file.description && (
                <p className="text-sm text-[#8D6E63] leading-relaxed line-clamp-2 mb-4"
                  style={{ fontFamily: 'var(--font-ui)' }}>
                  {file.description}
                </p>
              )}

              {data.note && (
                <p className="text-xs text-[#D7CCC8]/60 italic mb-4">
                  "{data.note}"
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/view/${file.id}`}
                className="btn btn-primary"
                style={{ background: '#F5F5F5', color: '#3E2723',
                         borderColor: '#F5F5F5', padding: '0.6rem 1.25rem' }}>
                View Score <ArrowRight size={14} />
              </Link>
              <a href={file.file_url} download={file.title} target="_blank" rel="noreferrer"
                className="btn"
                style={{ background: 'transparent', color: '#D7CCC8',
                         borderColor: 'rgba(215,204,200,0.3)',
                         padding: '0.6rem 1.25rem' }}>
                <Download size={14} /> Download
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}