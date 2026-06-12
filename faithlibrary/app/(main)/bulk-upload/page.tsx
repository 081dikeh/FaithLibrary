// app/(main)/bulk-upload/page.tsx — UI only, logic unchanged
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BulkUploadForm } from '@/components/BulkUploadForm'
import { Layers, Info, Zap } from 'lucide-react'

export default async function BulkUploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen grain" style={{ background: '#F7F4F2' }}>
      <Navbar />

      {/* ── Dark hero ── */}
      <div style={{ background: '#1C0E0A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, left: -40, width: 280, height: 280, borderRadius: '50%', background: 'rgba(93,64,55,0.25)', filter: 'blur(56px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 40px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'rgba(93,64,55,0.45)', border: '1px solid rgba(141,110,99,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D7CCC8',
            }}><Layers size={17} /></div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A4035', fontFamily: 'var(--font-ui)' }}>
              Bulk Upload
            </p>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#F7F4F2', lineHeight: 1.1, marginBottom: 8 }}>
            Upload hundreds
            <span style={{ display: 'block', color: '#7A5A4A', fontStyle: 'italic', fontWeight: 400 }}>at once</span>
          </h1>
          <p style={{ color: '#5A4035', fontSize: '0.875rem', fontFamily: 'var(--font-ui)', lineHeight: 1.7 }}>
            Set shared tags, drop your files, and upload up to 100 scores simultaneously.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }} className="bulk-layout">
          <div style={{ flex: 1, minWidth: 0 }}>
            <BulkUploadForm />
          </div>

          <aside style={{ width: 260, flexShrink: 0 }} className="bulk-sidebar">
            {/* Tips */}
            <div style={{
              background: '#1C0E0A', borderRadius: 18, padding: '22px',
              border: '1px solid rgba(255,255,255,0.05)', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(141,110,99,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8D6E63',
                }}><Zap size={13} /></div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D7CCC8' }}>Bulk upload tips</span>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {[
                  'Select up to 100 files at once',
                  'Files upload 5 at a time in parallel',
                  'Titles are pre-filled from each filename',
                  'Shared tags apply to the whole batch',
                  'Edit individual titles before uploading',
                  'Failed files can be retried without restarting',
                ].map((tip, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: '0.8rem', color: '#7A6055', lineHeight: 1.55 }}>
                    <span style={{ color: '#5D4037', flexShrink: 0, fontWeight: 700, marginTop: 1 }}>›</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Formats */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '18px',
              border: '1px solid #E8E0DC', boxShadow: '0 1px 3px rgba(62,39,35,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <Info size={13} style={{ color: '#8D6E63' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#5D4037', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Supported formats
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['PDF', 'MXL', 'MusicXML', 'XML'].map(f => (
                  <span key={f} style={{
                    padding: '4px 11px', borderRadius: 99,
                    background: '#F2EDE9', border: '1px solid #D7CCC8',
                    fontSize: '0.72rem', fontWeight: 700, color: '#5D4037',
                  }}>{f}</span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .bulk-layout  { flex-direction: column !important; }
          .bulk-sidebar { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}