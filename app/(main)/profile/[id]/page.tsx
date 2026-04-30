// app/(main)/page.tsx
import { Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FileCard, FileCardSkeleton } from '@/components/FileCard'
import { CategoryFilter } from '@/components/CategoryFilter'
import { TrendingUp, Library, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { FileRecord } from '@/lib/types'

interface HomeProps {
  searchParams: Promise<{ q?: string; tag?: string | string[] }>
}

const STATS = [
  { icon: <Library size={16} />,    label: 'Scores',       value: '1,200+' },
  { icon: <Users size={16} />,      label: 'Contributors', value: '340+' },
  { icon: <TrendingUp size={16} />, label: 'Downloads',    value: '18k+' },
]

async function FileGrid({ query, tags }: { query?: string; tags: string[] }) {
  const supabase = await createClient()

  let q = supabase
    .from('files')
    .select('*, profiles(full_name)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(48)

  if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
  if (tags.length > 0) q = q.overlaps('tags', tags)

  const { data: files, error } = await q

  if (error) return (
    <p className="text-center py-20 text-[#8D6E63] text-sm">
      Something went wrong. Please refresh.
    </p>
  )

  if (!files || files.length === 0) return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-[#EFE9E7] flex items-center justify-center">
        <div className="relative w-8 h-8 logo-on-light opacity-30">
          <Image src="/FaithLibrary_logo.png" alt="" fill className="object-contain" />
        </div>
      </div>
      <p className="font-display text-xl text-[#5D4037]">No scores found</p>
      <p className="text-[#8D6E63] text-sm max-w-xs leading-relaxed">
        {query
          ? `No results for "${query}". Try different keywords or clear filters.`
          : 'No scores yet. Be the first to upload.'}
      </p>
      <Link href="/upload" className="btn btn-primary btn-sm mt-2">
        Upload a score <ArrowRight size={13} />
      </Link>
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {(files as FileRecord[]).map((file, i) => (
        <FileCard key={file.id} file={file} index={i} />
      ))}
    </div>
  )
}

export default async function HomePage({ searchParams }: HomeProps) {
  const params  = await searchParams
  const query   = params.q
  const rawTags = params.tag
  const tags    = rawTags ? (Array.isArray(rawTags) ? rawTags : [rawTags]) : []
  const showHero = !query && tags.length === 0

  return (
    <div className="min-h-screen grain">
      <Navbar />

      {/* ── Hero ── */}
      {showHero && (
        <section className="relative overflow-hidden bg-[#3E2723] pt-12 pb-16 px-4 sm:px-6">
          {/* Bg blobs */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#5D4037]/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-[#8D6E63]/15 blur-3xl pointer-events-none" />
          {/* Staff lines */}
          <div className="absolute right-0 top-0 bottom-0 w-52 opacity-[0.04] pointer-events-none
                          flex flex-col justify-center gap-4 pr-8">
            {[...Array(5)].map((_, i) => <div key={i} className="h-px bg-[#F5F5F5]" />)}
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                            bg-[#5D4037]/60 border border-[#8D6E63]/30
                            text-[#D7CCC8] text-xs font-medium mb-5 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8D6E63] animate-pulse" />
              Sacred music library
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold
                           text-[#F5F5F5] leading-[1.1] mb-3 animate-fade-up">
              Discover & Share
              <span className="block text-[#D7CCC8] font-normal italic mt-1">
                Choral Music
              </span>
            </h1>

            <p className="text-[#8D6E63] text-sm sm:text-base max-w-lg mx-auto mb-8
                          animate-fade-up delay-100" style={{fontFamily:'var(--font-ui)'}}>
              A growing commons of hymns, choral scores, and sacred compositions —
              free to explore, upload, and share with the world.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-up delay-150">
              <Link href="/signup" className="btn btn-primary" style={{fontSize:'0.875rem', padding:'0.65rem 1.5rem'}}>
                Get started free <ArrowRight size={14} />
              </Link>
              <Link href="#library" className="btn btn-secondary"
                style={{background:'transparent', color:'#D7CCC8', borderColor:'rgba(141,110,99,0.5)',
                        fontSize:'0.875rem', padding:'0.65rem 1.5rem'}}>
                Browse library
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 animate-fade-up delay-200">
              {STATS.map(stat => (
                <div key={stat.label} className="flex items-center gap-2.5 text-[#D7CCC8]">
                  <div className="text-[#8D6E63]">{stat.icon}</div>
                  <div className="text-left">
                    <div className="font-display font-bold text-lg text-[#F5F5F5] leading-none">
                      {stat.value}
                    </div>
                    <div className="text-xs text-[#8D6E63] mt-0.5" style={{fontFamily:'var(--font-ui)'}}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Search results header ── */}
      {query && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">
          <p className="text-sm text-[#8D6E63]" style={{fontFamily:'var(--font-ui)'}}>
            Showing results for
          </p>
          <h2 className="font-display text-2xl text-[#3E2723]">
            "{query}"
          </h2>
        </div>
      )}

      {/* ── Library ── */}
      <main id="library" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Filter row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between
                        gap-4 mb-8">
          <div className="flex-1">
            <CategoryFilter active={tags} query={query} />
          </div>
          {!query && tags.length === 0 && (
            <h2 className="font-display text-lg font-semibold text-[#3E2723]
                           flex-shrink-0 hidden sm:block">
              Latest Additions
            </h2>
          )}
        </div>

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <FileCardSkeleton key={i} />)}
          </div>
        }>
          <FileGrid query={query} tags={tags} />
        </Suspense>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#D7CCC8] mt-12 py-8 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6
                        flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative w-6 h-7 logo-on-light">
              <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill className="object-contain" />
            </div>
            <span className="font-display font-semibold text-[#5D4037]">FaithLibrary</span>
          </div>
          <p className="text-xs text-[#8D6E63]" style={{fontFamily:'var(--font-ui)'}}>
            © {new Date().getFullYear()} FaithLibrary — A sacred music commons
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms"
              className="text-xs text-[#8D6E63] hover:text-[#5D4037] transition-colors">Terms</Link>
            <Link href="/privacy"
              className="text-xs text-[#8D6E63] hover:text-[#5D4037] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}