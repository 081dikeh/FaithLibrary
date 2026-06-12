// app/(main)/upload/page.tsx — UI only, logic unchanged
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
    <div className="min-h-screen grain" style={{ background: '#F7F4F2' }}>
      <Navbar />

      {/* ── Dark hero ── */}
      <div style={{ background: '#1C0E0A', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(93,64,55,0.25)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 40px', position: 'relative' }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A4035', marginBottom: 10, fontFamily: 'var(--font-ui)' }}>
            Upload a Score
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: '#F7F4F2', lineHeight: 1.1, marginBottom: 8 }}>
            Share your music
            <span style={{ display: 'block', color: '#7A5A4A', fontStyle: 'italic', fontWeight: 400 }}>with the community</span>
          </h1>
          <p style={{ color: '#5A4035', fontSize: '0.875rem', fontFamily: 'var(--font-ui)', lineHeight: 1.7 }}>
            Upload choral scores, hymns, and sacred compositions — free for everyone to discover and use.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }} className="upload-layout">

          {/* Form card */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              background: '#fff', borderRadius: 20,
              border: '1px solid #E8E0DC',
              boxShadow: '0 1px 3px rgba(62,39,35,0.05), 0 6px 20px rgba(62,39,35,0.07)',
              padding: '32px',
            }}>
              <UploadForm />
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ width: 272, flexShrink: 0 }} className="upload-sidebar">

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
                }}><Music2 size={13} /></div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D7CCC8', letterSpacing: '0.02em' }}>
                  Upload tips
                </span>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {[
                  'PDF format works best for all devices',
                  'MusicXML files are also supported',
                  'Use a clear title so others can find your score',
                  'Select all relevant categories — Mass part + Season + Occasion',
                  'Scores tagged with specific Mass parts rank better in search',
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
              border: '1px solid #E8E0DC',
              boxShadow: '0 1px 3px rgba(62,39,35,0.04)',
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <FileText size={13} style={{ color: '#5D4037' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#5D4037', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Supported formats
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['PDF', 'MXL', 'MusicXML', 'XML'].map(fmt => (
                  <span key={fmt} style={{
                    padding: '4px 11px', borderRadius: 99,
                    background: '#F2EDE9', border: '1px solid #D7CCC8',
                    fontSize: '0.72rem', fontWeight: 700, color: '#5D4037', letterSpacing: '0.04em',
                  }}>{fmt}</span>
                ))}
              </div>
            </div>

            {/* FaithScore note */}
            <div style={{
              background: '#F7F4F2', borderRadius: 16, padding: '18px',
              border: '1px solid #E8E0DC',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Info size={13} style={{ color: '#8D6E63' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8D6E63', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  FaithScore users
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9E8070', lineHeight: 1.65, fontFamily: 'var(--font-ui)' }}>
                Composing in FaithScore? You can publish directly to FaithLibrary
                from within the notation app once the integration is complete.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .upload-layout  { flex-direction: column !important; }
          .upload-sidebar { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}