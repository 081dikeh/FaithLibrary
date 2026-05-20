// app/(main)/profile/[id]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { ScoreCard } from '@/components/ScoreCard'
import { FileStack, Download, Calendar } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id }   = await params
  const supabase = await createClient()

  // Get profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (profileErr || !profile) notFound()

  // Get their public uploads
  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  const uploads        = (files ?? []) as FileRecord[]
  const totalDownloads = uploads.reduce((s, f) => s + (f.download_count ?? 0), 0)
  const joined         = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })

  const displayName = profile.full_name ?? 'Anonymous Musician'
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      {/* ── Profile header ── */}
      <div className="bg-[#3E2723] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full
                        bg-[#5D4037]/30 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex-shrink-0
                            bg-[#5D4037] flex items-center justify-center overflow-hidden
                            border-2 border-[#8D6E63]/40 shadow-xl">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName}
                  className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-2xl font-bold text-[#D7CCC8]">
                  {initials}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F5F5]">
                {displayName}
              </h1>

              {/* Stats row */}
              <div className="flex flex-wrap gap-5 mt-4">
                <div className="flex items-center gap-1.5 text-[#D7CCC8] text-sm"
                  style={{ fontFamily: 'var(--font-ui)' }}>
                  <FileStack size={14} className="text-[#8D6E63]" />
                  <span><strong className="text-[#F5F5F5]">{uploads.length}</strong> scores</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#D7CCC8] text-sm"
                  style={{ fontFamily: 'var(--font-ui)' }}>
                  <Download size={14} className="text-[#8D6E63]" />
                  <span><strong className="text-[#F5F5F5]">{totalDownloads}</strong> downloads</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#D7CCC8] text-sm"
                  style={{ fontFamily: 'var(--font-ui)' }}>
                  <Calendar size={14} className="text-[#8D6E63]" />
                  <span>Joined {joined}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Uploads grid ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h2 className="font-display text-xl font-semibold text-[#3E2723] mb-6">
          Published Scores
        </h2>

        {uploads.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EFE9E7]
                            flex items-center justify-center">
              <FileStack size={26} className="text-[#8D6E63]" />
            </div>
            <p className="font-display text-xl text-[#5D4037]">No public scores yet</p>
            <p className="text-sm text-[#8D6E63]">
              {displayName} hasn't published any scores to the library.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {uploads.map((file, i) => (
              <ScoreCard key={file.id} file={file} index={i} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}