// components/RelatedScores.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Music2 } from 'lucide-react'

interface RelatedScoresProps {
  fileId:  string
  tags:    string[]
}

export async function RelatedScores({ fileId, tags }: RelatedScoresProps) {
  if (!tags || tags.length === 0) return null
  const supabase = await createClient()

  const { data: files } = await supabase
    .from('files')
    .select('id, title, tags, download_count')
    .eq('is_public', true)
    .neq('id', fileId)
    .overlaps('tags', tags)
    .order('download_count', { ascending: false })
    .limit(5)

  if (!files || files.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#EFE9E7]">
        <h3 className="font-display text-sm font-semibold text-[#3E2723]">
          Related Scores
        </h3>
      </div>
      <div className="divide-y divide-[#EFE9E7]">
        {files.map(file => (
          <Link key={file.id} href={`/view/${file.id}`}
            className="flex items-start gap-3 px-5 py-3 hover:bg-[#F5F5F5]
                       transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-[#EFE9E7] flex items-center
                            justify-center text-[#8D6E63] flex-shrink-0 mt-0.5">
              <Music2 size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#3E2723] line-clamp-2
                            group-hover:text-[#5D4037] transition-colors leading-snug"
                style={{ fontFamily: 'var(--font-ui)' }}>
                {file.title}
              </p>
              {file.tags && file.tags.length > 0 && (
                <p className="text-xs text-[#8D6E63] mt-0.5 truncate">
                  {file.tags.slice(0, 2).join(' · ')}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}