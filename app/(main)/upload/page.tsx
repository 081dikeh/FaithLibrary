// app/(main)/upload/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { UploadForm } from '@/components/UploadForm'
import { FileText, Music2, Info } from 'lucide-react'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-[#D7CCC8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2723]">
            Upload a Score
          </h1>
          <p className="text-[#8D6E63] mt-1.5 text-sm sm:text-base" style={{fontFamily:'var(--font-ui)'}}>
            Share your choral music with the FaithLibrary community.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Form ── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-6 sm:p-8">
              <UploadForm />
            </div>
          </div>

          {/* ── Sidebar tips ── */}
          <aside className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4">

            {/* Tips card */}
            <div className="bg-[#3E2723] rounded-2xl p-5 text-[#D7CCC8]">
              <div className="flex items-center gap-2 text-[#F5F5F5] font-semibold text-sm mb-3">
                <Music2 size={15} /> Upload tips
              </div>
              <ul className="space-y-2.5 text-sm">
                {[
                  'PDF format works best for all devices',
                  'MusicXML files are also supported',
                  'Add a clear title so others can find your score',
                  'Select all relevant categories — Mass part + Season + Occasion',
                  'Scores tagged with specific Mass parts rank better in search',
                ].map((tip, i) => (
                  <li key={i} className="flex gap-2.5 leading-snug">
                    <span className="text-[#8D6E63] mt-0.5 flex-shrink-0">›</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Formats */}
            <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-5">
              <div className="flex items-center gap-2 text-[#5D4037] font-semibold text-sm mb-3">
                <FileText size={14} /> Supported formats
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['PDF', 'MXL', 'MusicXML', 'XML'].map(fmt => (
                  <span key={fmt} className="badge badge-sand">{fmt}</span>
                ))}
              </div>
            </div>

            {/* Note about notation app */}
            <div className="bg-[#EFE9E7] rounded-2xl border border-[#D7CCC8] p-5">
              <div className="flex items-center gap-2 text-[#5D4037] font-semibold text-sm mb-2">
                <Info size={14} /> FaithScore users
              </div>
              <p className="text-xs text-[#8D6E63] leading-relaxed" style={{fontFamily:'var(--font-ui)'}}>
                Composing in FaithScore? You can publish directly to FaithLibrary
                from within the notation app once the integration is complete.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}