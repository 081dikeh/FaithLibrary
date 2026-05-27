// components/FileCard.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Download, Bookmark, BookmarkCheck, Eye, Music, FileText } from 'lucide-react'
import type { FileRecord } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const COVER_COLORS: Record<string, string> = {
  'Entrance':            'from-[#4E342E] to-[#6D4C41]',
  'Kyrie':               'from-[#37474F] to-[#546E7A]',
  'Gloria':              'from-[#5D4037] to-[#8D6E63]',
  'Responsorial Psalm':  'from-[#4A148C]/60 to-[#7B1FA2]/40',
  'Gospel Acclamation':  'from-[#E65100]/60 to-[#FF8F00]/40',
  'Credo':               'from-[#1B5E20]/60 to-[#388E3C]/40',
  'Offertory':           'from-[#BF360C]/50 to-[#E64A19]/30',
  'Sanctus':             'from-[#F9A825]/50 to-[#FFD54F]/30',
  'Consecration':        'from-[#880E4F]/60 to-[#C2185B]/40',
  'Lamb of God':         'from-[#F5F5F5]/80 to-[#D7CCC8]',
  'Communion':           'from-[#795548] to-[#A1887F]',
  'Recessional':         'from-[#33691E]/60 to-[#689F38]/40',
}

function getCoverGradient(tags: string[]): string {
  for (const tag of tags) {
    if (COVER_COLORS[tag]) return COVER_COLORS[tag]
  }
  return 'from-[#EFE9E7] to-[#D7CCC8]'
}

interface FileCardProps {
  file: FileRecord
  bookmarked?: boolean
  onBookmarkToggle?: (id: string) => void
  index?: number
}

export function FileCard({ file, bookmarked = false, onBookmarkToggle, index = 0 }: FileCardProps) {
  const supabase  = createClient()
  const [isBookmarked, setIsBookmarked] = useState(bookmarked)
  const [bmLoading, setBmLoading]       = useState(false)

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setBmLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().match({ user_id: user.id, file_id: file.id })
      setIsBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, file_id: file.id })
      setIsBookmarked(true)
    }
    onBookmarkToggle?.(file.id)
    setBmLoading(false)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    await supabase.rpc('increment_download_count', { file_id: file.id })
    const a = document.createElement('a')
    a.href = file.file_url; a.download = file.title; a.target = '_blank'; a.click()
  }

  const date     = new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const gradient = getCoverGradient(file.tags ?? [])
  const delays   = ['', 'delay-50', 'delay-100', 'delay-150', 'delay-200', 'delay-250', 'delay-300', 'delay-400']
  const delay    = delays[index % 8]
  const primaryTag = file.tags?.[0]

  return (
    <article
      className={`card group flex flex-col animate-fade-up ${delay}`}
      style={{animationFillMode:'forwards'}}
    >
      {/* ── Cover ── */}
      <Link href={`/view/${file.id}`} className="block flex-shrink-0">
        <div className={`relative h-44 bg-gradient-to-br ${gradient} overflow-hidden`}>

          {file.thumbnail_url ? (
            <img src={file.thumbnail_url} alt={file.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              {/* Staff lines */}
              <div className="absolute inset-0 flex flex-col justify-center gap-[10px] px-8 opacity-15">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-px bg-[#3E2723]" />
                ))}
              </div>
              <div className="relative w-10 h-10 rounded-full bg-black/10 backdrop-blur-sm
                              flex items-center justify-center text-white/80">
                <Music size={18} />
              </div>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-[#3E2723]/65 opacity-0
                          group-hover:opacity-100 transition-opacity duration-300
                          flex items-center justify-center">
            <div className="flex items-center gap-1.5 bg-white text-[#3E2723]
                            px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg
                            translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
              <Eye size={12} /> View Score
            </div>
          </div>

          {/* Primary tag badge */}
          {primaryTag && (
            <div className="absolute top-2.5 left-2.5 badge badge-walnut
                            bg-white/90 backdrop-blur-sm text-[#5D4037] border-white/60
                            shadow-sm">
              {primaryTag}
            </div>
          )}
        </div>
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4">
        <Link href={`/view/${file.id}`}>
          <h3 className="font-display font-semibold text-[#3E2723] text-[0.9375rem]
                         leading-snug line-clamp-2 group-hover:text-[#5D4037]
                         transition-colors duration-200 mb-1">
            {file.title}
          </h3>
        </Link>

        {file.description && (
          <p className="text-xs text-[#8D6E63] line-clamp-2 leading-relaxed mb-2"
            style={{fontFamily:'var(--font-ui)'}}>
            {file.description}
          </p>
        )}

        {/* Composer / voice parts */}
        {(file.composer || file.voice_parts) && (
          <p className="text-xs text-[#8D6E63] mb-1 truncate"
            style={{ fontFamily: 'var(--font-ui)' }}>
            {[file.composer, file.voice_parts].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Uploader */}
        {file.profiles?.full_name && (
          <Link href={`/profile/${file.user_id}`}
            onClick={e => e.stopPropagation()}
            className="text-[0.72rem] text-[#8D6E63] hover:text-[#5D4037] transition-colors mb-2
                       flex items-center gap-1"
            style={{fontFamily:'var(--font-ui)'}}>
            by {file.profiles.full_name}
          </Link>
        )}

        {/* Extra tags */}
        {file.tags && file.tags.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {file.tags.slice(1, 4).map(tag => (
              <span key={tag} className="badge badge-sand text-[0.62rem]">{tag}</span>
            ))}
            {file.tags.length > 4 && (
              <span className="text-[0.65rem] text-[#8D6E63] self-center">+{file.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-auto pt-3 border-t border-[#EFE9E7]
                        flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[#8D6E63] min-w-0">
            <span className="text-[0.72rem] truncate">{date}</span>
            {(file.download_count ?? 0) > 0 && (
              <>
                <span className="text-[#D7CCC8] flex-shrink-0">·</span>
                <span className="text-[0.72rem] flex-shrink-0">{file.download_count}</span>
                <Download size={10} className="flex-shrink-0" />
              </>
            )}
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={handleBookmark} disabled={bmLoading} aria-label="Bookmark"
              className={`btn-icon ${isBookmarked ? 'text-[#5D4037] bg-[#EFE9E7]' : ''}`}
              style={{padding:'0.35rem', borderRadius:'8px'}}>
              {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
            <button onClick={handleDownload} aria-label="Download"
              className="btn-icon" style={{padding:'0.35rem', borderRadius:'8px'}}>
              <Download size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

/* ── Skeleton ── */
export function FileCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="h-44 skeleton" style={{borderRadius:'0'}} />
      <div className="p-4 space-y-2.5">
        <div className="h-4 skeleton w-4/5" />
        <div className="h-3 skeleton w-full" />
        <div className="h-3 skeleton w-2/3" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-16 skeleton rounded-full" />
          <div className="h-5 w-12 skeleton rounded-full" />
        </div>
      </div>
    </div>
  )
}