// components/HomeStats.tsx
import { createClient } from '@/lib/supabase/server'
import { Library, Users, Download, Music2 } from 'lucide-react'

export async function HomeStats() {
  const supabase = await createClient()

  const [
    { count: fileCount },
    { count: userCount },
    { data: dlData },
  ] = await Promise.all([
    supabase.from('files').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('files').select('download_count').eq('is_public', true),
  ])

  const totalDownloads = (dlData ?? []).reduce((s, f) => s + (f.download_count ?? 0), 0)

  const fmt = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+`
    return n > 0 ? `${n}+` : '0'
  }

  const stats = [
    { icon: <Library size={16} />,  label: 'Scores',       value: fmt(fileCount ?? 0) },
    { icon: <Users size={16} />,    label: 'Contributors', value: fmt(userCount ?? 0) },
    { icon: <Download size={16} />, label: 'Downloads',    value: fmt(totalDownloads) },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-6 sm:gap-10 animate-fade-up delay-200">
      {stats.map(stat => (
        <div key={stat.label} className="flex items-center gap-2.5 text-[#D7CCC8]">
          <div className="text-[#8D6E63]">{stat.icon}</div>
          <div className="text-left">
            <div className="font-display font-bold text-lg text-[#F5F5F5] leading-none">
              {stat.value}
            </div>
            <div className="text-xs text-[#8D6E63] mt-0.5" style={{ fontFamily: 'var(--font-ui)' }}>
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}