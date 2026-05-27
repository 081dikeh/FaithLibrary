// app/(main)/stats/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import {
  FileStack, Users, Download, TrendingUp,
  Music2, Star, Award,
} from 'lucide-react'

export const revalidate = 3600 // revalidate every hour

export default async function StatsPage() {
  const supabase = await createClient()

  const [
    { count: totalFiles },
    { count: totalUsers },
    { data: topScores },
    { data: topUploaders },
    { data: tagStats },
    { data: recentFiles },
  ] = await Promise.all([
    supabase.from('files').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('files')
      .select('id, title, download_count, composer, tags')
      .eq('is_public', true)
      .order('download_count', { ascending: false })
      .limit(10),
    supabase.from('files')
      .select('user_id, profiles(full_name), count:id')
      .eq('is_public', true)
      .limit(100),
    supabase.from('files')
      .select('tags')
      .eq('is_public', true)
      .limit(1000),
    supabase.from('files')
      .select('id, title, created_at, composer')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Compute total downloads
  const { data: dlData } = await supabase
    .from('files').select('download_count').eq('is_public', true)
  const totalDownloads = (dlData ?? []).reduce((s, f) => s + (f.download_count ?? 0), 0)

  // Count tags
  const tagCounts: Record<string, number> = {}
  ;(tagStats ?? []).forEach((f: any) => {
    (f.tags ?? []).forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    })
  })
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)

  // Top uploaders (group by user_id)
  const uploaderMap: Record<string, { name: string; count: number }> = {}
  ;(topUploaders ?? []).forEach((f: any) => {
    const uid  = f.user_id
    const name = f.profiles?.full_name ?? 'Anonymous'
    if (!uploaderMap[uid]) uploaderMap[uid] = { name, count: 0 }
    uploaderMap[uid].count++
  })
  const topContributors = Object.entries(uploaderMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  const summaryStats = [
    { icon: <FileStack size={22} />, label: 'Public Scores',    value: (totalFiles ?? 0).toLocaleString() },
    { icon: <Users size={22} />,     label: 'Contributors',     value: (totalUsers ?? 0).toLocaleString() },
    { icon: <Download size={22} />,  label: 'Total Downloads',  value: totalDownloads.toLocaleString() },
    { icon: <TrendingUp size={22}/>, label: 'Categories Used',  value: Object.keys(tagCounts).length.toLocaleString() },
  ]

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      {/* Header */}
      <div className="bg-[#3E2723] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full
                        bg-[#5D4037]/30 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-[#8D6E63] text-xs font-semibold uppercase tracking-widest mb-2">
            Community
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F5F5F5]">
            Library Stats
          </h1>
          <p className="text-[#8D6E63] mt-2 text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
            A living record of our shared sacred music commons.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map(stat => (
            <div key={stat.label}
              className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-6 text-center">
              <div className="flex justify-center text-[#5D4037] mb-3">{stat.icon}</div>
              <p className="font-display text-3xl font-bold text-[#3E2723]">{stat.value}</p>
              <p className="text-sm text-[#8D6E63] mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Top downloaded scores */}
          <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EFE9E7] flex items-center gap-2">
              <Award size={15} className="text-amber-400" />
              <h2 className="font-display text-base font-semibold text-[#3E2723]">
                Most Downloaded
              </h2>
            </div>
            <div className="divide-y divide-[#EFE9E7]">
              {(topScores ?? []).map((file: any, i: number) => (
                <Link key={file.id} href={`/view/${file.id}`}
                  className="flex items-center gap-3 px-5 py-3
                             hover:bg-[#F5F5F5] transition-colors group">
                  <span className={`w-6 text-center text-sm font-bold flex-shrink-0 ${
                    i === 0 ? 'text-amber-400' :
                    i === 1 ? 'text-[#8D6E63]' :
                    i === 2 ? 'text-[#8D6E63]/60' : 'text-[#D7CCC8]'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#3E2723] truncate
                                  group-hover:text-[#5D4037] transition-colors"
                      style={{ fontFamily: 'var(--font-ui)' }}>
                      {file.title}
                    </p>
                    {file.composer && (
                      <p className="text-xs text-[#8D6E63] truncate">{file.composer}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#8D6E63] flex-shrink-0">
                    <Download size={11} /> {file.download_count ?? 0}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top categories */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#EFE9E7] flex items-center gap-2">
                <Music2 size={15} className="text-[#5D4037]" />
                <h2 className="font-display text-base font-semibold text-[#3E2723]">
                  Top Categories
                </h2>
              </div>
              <div className="p-5 space-y-2.5">
                {topTags.map(([tag, count]) => {
                  const pct = Math.round((count / (totalFiles || 1)) * 100)
                  return (
                    <div key={tag}>
                      <div className="flex items-center justify-between text-xs mb-1"
                        style={{ fontFamily: 'var(--font-ui)' }}>
                        <span className="text-[#3E2723] font-medium truncate mr-2">{tag}</span>
                        <span className="text-[#8D6E63] flex-shrink-0">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#EFE9E7] overflow-hidden">
                        <div className="h-full rounded-full bg-[#5D4037] transition-all"
                          style={{ width: `${Math.max(pct, 3)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top contributors */}
            <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-[#EFE9E7] flex items-center gap-2">
                <Star size={15} className="text-[#5D4037]" />
                <h2 className="font-display text-base font-semibold text-[#3E2723]">
                  Top Contributors
                </h2>
              </div>
              <div className="divide-y divide-[#EFE9E7]">
                {topContributors.map(([userId, { name, count }], i) => (
                  <Link key={userId} href={`/profile/${userId}`}
                    className="flex items-center gap-3 px-5 py-3
                               hover:bg-[#F5F5F5] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#EFE9E7] flex items-center
                                    justify-center text-xs font-bold text-[#5D4037] flex-shrink-0">
                      {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium text-[#3E2723] truncate"
                      style={{ fontFamily: 'var(--font-ui)' }}>
                      {name}
                    </span>
                    <span className="text-xs text-[#8D6E63] flex-shrink-0">
                      {count} score{count !== 1 ? 's' : ''}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recently added */}
        <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EFE9E7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-[#5D4037]" />
              <h2 className="font-display text-base font-semibold text-[#3E2723]">
                Latest Additions
              </h2>
            </div>
            <Link href="/browse" className="text-xs text-[#8D6E63] hover:text-[#5D4037]
                                            transition-colors font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[#EFE9E7]">
            {(recentFiles ?? []).map((file: any) => (
              <Link key={file.id} href={`/view/${file.id}`}
                className="flex items-center gap-3 px-5 py-3
                           hover:bg-[#F5F5F5] transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-[#EFE9E7] flex items-center
                                justify-center text-[#8D6E63] flex-shrink-0">
                  <Music2 size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#3E2723] truncate
                                group-hover:text-[#5D4037] transition-colors"
                    style={{ fontFamily: 'var(--font-ui)' }}>
                    {file.title}
                  </p>
                  {file.composer && (
                    <p className="text-xs text-[#8D6E63]">{file.composer}</p>
                  )}
                </div>
                <p className="text-xs text-[#D7CCC8] flex-shrink-0">
                  {new Date(file.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}