// components/CategoryExplorer.tsx
// "Explore Categories" section — plain white cards with soft icon tiles,
// walnut/cream palette, real per-tag counts pulled live from Supabase.
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  DoorOpen, Gift, Coffee, LogOut, Heart, Sparkles, Flower2, Gem, ArrowRight,
} from 'lucide-react'

const FEATURED_CATEGORIES = [
  { tag: 'Entrance',                label: 'Entrance Songs',    icon: DoorOpen },
  { tag: 'Offertory',                label: 'Offertory Hymns',   icon: Gift },
  { tag: 'Communion',                label: 'Communion Hymns',   icon: Coffee },
  { tag: 'Recessional',              label: 'Recessional',       icon: LogOut },
  { tag: 'Meditation / Reflection',  label: 'Prayer',            icon: Heart },
  { tag: 'Praise & Worship',         label: 'Celebrations',      icon: Sparkles },
  { tag: 'Marian Hymns',             label: 'Marian Hymns',      icon: Flower2 },
  { tag: 'Wedding',                  label: 'Weddings',          icon: Gem },
]

export async function CategoryExplorer() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('files')
    .select('tags')
    .eq('is_public', true)
    .limit(20000)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    for (const t of (row.tags ?? []) as string[]) {
      counts[t] = (counts[t] ?? 0) + 1
    }
  }

  return (
    <section id="categories" className="bg-white border-y border-[#EFE9E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2723] mb-2">
              Explore Categories
            </h2>
            <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
              Find songs by where they&rsquo;re sung and their theme.
            </p>
          </div>
          <Link
            href="/browse"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#5D4037] hover:text-[#3E2723] transition-colors"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 14,
          }}
        >
          {FEATURED_CATEGORIES.map(cat => {
            const Icon = cat.icon
            const count = counts[cat.tag] ?? 0
            return (
              <Link
                key={cat.tag}
                href={`/?tag=${encodeURIComponent(cat.tag)}`}
                className="category-card"
                style={{
                  display: 'block',
                  padding: '20px',
                  borderRadius: 14,
                  background: '#FFFFFF',
                  border: '1px solid #EFE9E7',
                  textDecoration: 'none',
                  transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s ease, border-color 0.2s ease',
                }}
              >
                <span
                  className="category-icon"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 44, height: 44, borderRadius: 12,
                    background: '#F5F0EA', color: '#5D4037',
                    marginBottom: 16, transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  <Icon size={20} />
                </span>
                <p className="font-display font-bold text-[#3E2723]" style={{ fontSize: '1rem', marginBottom: 3 }}>
                  {cat.label}
                </p>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: '#A08070' }}>
                  {count.toLocaleString()} {count === 1 ? 'song' : 'songs'}
                </p>
              </Link>
            )
          })}
        </div>

        <div className="flex justify-center mt-10">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 font-semibold text-[#5D4037] hover:text-[#3E2723] transition-colors"
            style={{
              fontFamily: 'var(--font-ui)', fontSize: '0.875rem',
              padding: '0.75rem 1.5rem', borderRadius: 11,
              border: '1.5px solid #D7CCC8', background: '#FFFFFF',
            }}
          >
            View all categories <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <style>{`
        .category-card:hover { transform: translateY(-3px); border-color: #D7CCC8 !important; box-shadow: 0 10px 26px rgba(62,39,35,0.08); }
        .category-card:hover .category-icon { background: #3E2723; color: #F7F4F2; }
      `}</style>
    </section>
  )
}