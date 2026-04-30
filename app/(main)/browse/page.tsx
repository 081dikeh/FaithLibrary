// app/(main)/browse/page.tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FileCard, FileCardSkeleton } from '@/components/FileCard'
import { BrowseControls } from '@/components/BrowseControls'
import type { FileRecord } from '@/lib/types'

interface BrowseProps {
    searchParams: Promise<{
        q?: string
        tag?: string | string[]
        sort?: string
        page?: string
    }>
}

const PAGE_SIZE = 24

async function BrowseGrid({
    query, tags, sort, page,
}: {
    query?: string; tags: string[]; sort: string; page: number
}) {
    const supabase = await createClient()
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let q = supabase
        .from('files')
        .select('*, profiles(full_name)', { count: 'exact' })
        .eq('is_public', true)

    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    if (tags.length > 0) q = q.overlaps('tags', tags)

    switch (sort) {
        case 'downloads': q = q.order('download_count', { ascending: false }); break
        case 'az': q = q.order('title', { ascending: true }); break
        case 'za': q = q.order('title', { ascending: false }); break
        default: q = q.order('created_at', { ascending: false }); break
    }

    q = q.range(from, to)

    const { data: files, error, count } = await q

    if (error) return (
        <p className="text-center py-20 text-[#8D6E63] text-sm">
            Something went wrong. Please refresh.
        </p>
    )

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

    return (
        <div className="space-y-8">
            {/* Result count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
                    {count ?? 0} score{(count ?? 0) !== 1 ? 's' : ''} found
                    {query && <> for <span className="text-[#5D4037] font-medium">"{query}"</span></>}
                </p>
                {totalPages > 1 && (
                    <p className="text-xs text-[#8D6E63]">
                        Page {page} of {totalPages}
                    </p>
                )}
            </div>

            {/* Grid */}
            {!files || files.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-24 text-center">
                    <p className="font-display text-xl text-[#5D4037]">No scores found</p>
                    <p className="text-sm text-[#8D6E63] max-w-xs">
                        Try adjusting your search or clearing some filters.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {(files as FileRecord[]).map((file, i) => (
                        <FileCard key={file.id} file={file} index={i} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination current={page} total={totalPages} query={query} tags={tags} sort={sort} />
            )}
        </div>
    )
}

function Pagination({
    current, total, query, tags, sort,
}: {
    current: number; total: number; query?: string; tags: string[]; sort: string
}) {
    const buildHref = (p: number) => {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        tags.forEach(t => params.append('tag', t))
        if (sort !== 'newest') params.set('sort', sort)
        params.set('page', String(p))
        return `/browse?${params}`
    }

    const pages = Array.from({ length: total }, (_, i) => i + 1)
        .filter(p => Math.abs(p - current) <= 2 || p === 1 || p === total)

    return (
        <div className="flex items-center justify-center gap-1.5 pt-4">
            {pages.map((p, i) => {
                const prev = pages[i - 1]
                return (
                    <div key={p} className="flex items-center gap-1.5">
                        {prev && p - prev > 1 && (
                            <span className="text-[#D7CCC8] text-sm px-1">…</span>
                        )}
                        <a
                            href={buildHref(p)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm
                          font-medium transition-all duration-150 ${p === current
                                    ? 'bg-[#5D4037] text-white'
                                    : 'bg-white border border-[#D7CCC8] text-[#8D6E63] hover:border-[#8D6E63] hover:text-[#5D4037]'
                                }`}
                        >
                            {p}
                        </a>
                    </div>
                )
            })}
        </div>
    )
}

export default async function BrowsePage({ searchParams }: BrowseProps) {
    const params = await searchParams
    const query = params.q
    const rawTags = params.tag
    const tags = rawTags ? (Array.isArray(rawTags) ? rawTags : [rawTags]) : []
    const sort = params.sort ?? 'newest'
    const page = Math.max(1, parseInt(params.page ?? '1', 10))

    return (
        <div className="min-h-screen grain bg-[#F5F5F5]">
            <Navbar />

            {/* Page header */}
            <div className="bg-white border-b border-[#D7CCC8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-8">
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2723]">
                        Browse Library
                    </h1>
                    <p className="text-[#8D6E63] mt-1 text-sm sm:text-base"
                        style={{ fontFamily: 'var(--font-ui)' }}>
                        Explore the full collection — filter by category, season, or occasion.
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                {/* Controls row */}
                <BrowseControls
                    query={query}
                    activeTags={tags}
                    activeSort={sort}
                />

                <div className="mt-8">
                    <Suspense fallback={
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {[...Array(12)].map((_, i) => <FileCardSkeleton key={i} />)}
                        </div>
                    }>
                        <BrowseGrid query={query} tags={tags} sort={sort} page={page} />
                    </Suspense>
                </div>
            </main>
        </div>
    )
}