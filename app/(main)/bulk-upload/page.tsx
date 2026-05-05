// app/(main)/bulk-upload/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BulkUploadForm } from '@/components/BulkUploadForm'
import { Layers, Info } from 'lucide-react'

export default async function BulkUploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      <div className="bg-white border-b border-[#D7CCC8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5D4037]/10 flex items-center
                            justify-center text-[#5D4037] flex-shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-[#3E2723]">
                Bulk Upload
              </h1>
              <p className="text-[#8D6E63] text-sm mt-0.5" style={{ fontFamily: 'var(--font-ui)' }}>
                Upload hundreds of scores at once — set shared tags then upload.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          <div className="flex-1 min-w-0">
            <BulkUploadForm />
          </div>

          {/* Tips */}
          <aside className="lg:w-64 xl:w-72 flex-shrink-0 space-y-4">
            <div className="bg-[#3E2723] rounded-2xl p-5 text-[#D7CCC8]">
              <div className="flex items-center gap-2 text-[#F5F5F5] font-semibold text-sm mb-3">
                <Info size={14} /> Bulk upload tips
              </div>
              <ul className="space-y-2.5 text-sm">
                {[
                  'Select up to 100 files at once',
                  'Files upload in parallel — 5 at a time',
                  'Each file title is pre-filled from its filename',
                  'Shared tags apply to all files in the batch',
                  'You can edit individual titles before uploading',
                  'Failed files can be retried without re-uploading the whole batch',
                ].map((tip, i) => (
                  <li key={i} className="flex gap-2 leading-snug">
                    <span className="text-[#8D6E63] flex-shrink-0 mt-0.5">›</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-5">
              <p className="text-xs font-semibold text-[#5D4037] uppercase tracking-widest mb-2">
                Supported formats
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['PDF', 'MXL', 'MusicXML', 'XML'].map(f => (
                  <span key={f} className="badge badge-sand">{f}</span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}