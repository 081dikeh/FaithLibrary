// components/HeroScoreStack.tsx
// Hero visual: a staggered 2x2 grid of real scores, pulled live from
// Supabase — walnut/cream palette matching the rest of the app.
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Music2, Tag } from 'lucide-react'

export async function HeroScoreStack() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('files')
    .select('id, title, composer, tags, voice_parts, thumbnail_url')
    .eq('is_public', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(4)

  const files = data ?? []
  const columns = [
    [files[0], files[2]].filter(Boolean),
    [files[1], files[3]].filter(Boolean),
  ]

  if (files.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-[#EFE9E7]"
        style={{ height: 380, background: 'linear-gradient(160deg, #3E2723, #5D4037)' }}
      >
        <Music2 size={40} style={{ color: 'rgba(255,255,255,0.5)' }} />
      </div>
    )
  }

  const Card = ({ file }: { file: NonNullable<(typeof files)[number]> }) => {
    const badge = file.voice_parts || (file.tags && file.tags[0]) || null
    return (
      <Link href={`/view/${file.id}`} className="group block">
        <div
          className="relative overflow-hidden rounded-xl border border-[#EFE9E7] transition-shadow duration-200 group-hover:shadow-lg"
          style={{ aspectRatio: '0.78', background: '#F5F0EA' }}
        >
          {file.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.thumbnail_url}
              alt={file.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Music2 size={30} strokeWidth={1.6} style={{ color: '#B0947F' }} />
            </div>
          )}
          {badge && (
            <span
              className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[0.68rem] font-semibold shadow-sm"
              style={{ fontFamily: 'var(--font-ui)', color: '#5D4037' }}
            >
              <Tag size={10} /> {badge}
            </span>
          )}
        </div>
        <p className="font-display font-semibold text-sm text-[#3E2723] mt-2.5 leading-snug truncate">
          {file.title}
        </p>
        {file.composer && (
          <p className="text-xs mt-0.5 truncate" style={{ fontFamily: 'var(--font-ui)', color: '#A08070' }}>
            {file.composer}
          </p>
        )}
      </Link>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 max-w-md mx-auto lg:mx-0">
      <div className="flex flex-col gap-4 sm:gap-5">
        {columns[0].map(f => <Card key={f!.id} file={f!} />)}
      </div>
      <div className="flex flex-col gap-4 sm:gap-5 mt-10 sm:mt-14">
        {columns[1].map(f => <Card key={f!.id} file={f!} />)}
      </div>
    </div>
  )
}