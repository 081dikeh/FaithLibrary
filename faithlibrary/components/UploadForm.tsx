// components/UploadForm.tsx — UI only, all logic identical to original
'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TagDropdown } from '@/components/TagDropdown'
import { Upload, X, CheckCircle2, AlertCircle, FileText, Loader2, Globe, Lock, CloudUpload } from 'lucide-react'
import { isPdfFile, FILE_TYPE_ERROR_MESSAGE } from '@/lib/validation'
import { LICENSE_OPTIONS, type LicenseStatus } from '@/lib/license'

interface FormState {
  title: string; description: string; composer: string
  arranger: string; voice_parts: string; tags: string[]; is_public: boolean
  license_status: LicenseStatus
}

export function UploadForm() {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [file,     setFile]     = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status,   setStatus]   = useState<'idle'|'uploading'|'success'|'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState<FormState>({
    title: '', description: '', composer: '', arranger: '', voice_parts: '', tags: [], is_public: true,
    license_status: 'unknown',
  })

  const acceptFile = useCallback((f: File) => {
    if (!isPdfFile(f)) {
      setFileError(FILE_TYPE_ERROR_MESSAGE)
      setFile(null)
      return
    }
    setFileError('')
    setFile(f)
    if (!form.title)
      setForm(prev => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') }))
  }, [form.title])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) acceptFile(dropped)
  }

  const handleUpload = async () => {
    if (!file || !form.title.trim()) return
    if (!isPdfFile(file)) { setStatus('error'); setErrorMsg(FILE_TYPE_ERROR_MESSAGE); return }
    setStatus('uploading'); setProgress(10); setErrorMsg('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      setProgress(25)
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
      const { error: storageErr } = await supabase.storage
        .from('faithlibrary-files')
        .upload(path, file, { contentType: 'application/pdf', cacheControl: '3600' })
      if (storageErr) throw storageErr
      setProgress(70)
      const { data: { publicUrl } } = supabase.storage.from('faithlibrary-files').getPublicUrl(path)
      let thumbnailUrl: string | null = null
      try {
        const { generatePdfThumbnail } = await import('@/lib/generateThumbnail')
        const thumbBlob = await generatePdfThumbnail(publicUrl, 400)
        if (thumbBlob) {
          const thumbPath = `${user.id}/thumbs/${Date.now()}.jpg`
          const { error: thumbErr } = await supabase.storage.from('faithlibrary-files')
            .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', cacheControl: '3600' })
          if (!thumbErr) {
            const { data: { publicUrl: tUrl } } = supabase.storage.from('faithlibrary-files').getPublicUrl(thumbPath)
            thumbnailUrl = tUrl
          }
        }
      } catch { /* thumbnail is optional */ }
      setProgress(88)
      const { error: dbErr } = await supabase.from('files').insert({
        user_id: user.id, title: form.title.trim(), description: form.description.trim() || null,
        composer: form.composer.trim() || null, arranger: form.arranger.trim() || null,
        voice_parts: form.voice_parts.trim() || null, category: form.tags[0] ?? 'General',
        tags: form.tags, is_public: form.is_public, file_url: publicUrl, thumbnail_url: thumbnailUrl,
        license_status: form.license_status,
      })
      if (dbErr) throw new Error(dbErr.message + (dbErr.details ? ' — ' + dbErr.details : '') + (dbErr.hint ? ' — Hint: ' + dbErr.hint : ''))
      setProgress(100); setStatus('success')
      setTimeout(() => router.push('/dashboard'), 1400)
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Upload failed. Please try again.')
      setStatus('error'); setProgress(0)
    }
  }

  const canUpload = file && form.title.trim() && form.tags.length > 0
    && status !== 'uploading' && status !== 'success'

  /* shared input focus handlers */
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#5D4037'
    e.target.style.boxShadow = '0 0 0 3px rgba(93,64,55,0.1)'
    e.target.style.background = '#fff'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#E0D8D4'
    e.target.style.boxShadow = 'none'
    e.target.style.background = '#FAFAF9'
  }

  const inputBase: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--font-ui)', fontSize: '0.875rem',
    color: '#2C1810', background: '#FAFAF9',
    border: '1.5px solid #E0D8D4', borderRadius: 10,
    padding: '10px 13px', outline: 'none', lineHeight: 1.5,
    transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Drop zone ── */}
      <div
        role="button"
        tabIndex={0}
        aria-label={file ? `Selected file: ${file.name}. Press Enter to choose a different file.` : 'Choose a PDF score file to upload.'}
        aria-describedby={fileError ? 'upload-file-error' : undefined}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() } }}
        style={{
          border: `2px dashed ${file ? '#5D4037' : dragging ? '#8D6E63' : '#C4B5AF'}`,
          borderRadius: 16, padding: '32px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 12, cursor: 'pointer', userSelect: 'none',
          background: file ? 'rgba(93,64,55,0.04)' : dragging ? 'rgba(141,110,99,0.06)' : '#FAFAF9',
          transform: dragging ? 'scale(1.015)' : 'scale(1)',
          transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
          position: 'relative',
        }}
      >
        <input ref={fileRef} type="file" aria-hidden="true" tabIndex={-1} style={{ display: 'none' }}
          accept=".pdf,application/pdf"
          onChange={e => e.target.files?.[0] && acceptFile(e.target.files[0])} />

        {file ? (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(93,64,55,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5D4037',
            }}><FileText size={22} /></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, color: '#3E2723', fontSize: '0.9rem', marginBottom: 3 }}>{file.name}</p>
              <p style={{ fontSize: '0.775rem', color: '#8D6E63', fontFamily: 'var(--font-ui)' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB · ready to upload
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setFile(null) }}
              aria-label="Remove selected file"
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 28, height: 28, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#F2EDE9', border: '1px solid #D7CCC8',
                color: '#8D6E63', cursor: 'pointer', transition: 'all 0.15s',
              }}
            ><X size={13} /></button>
          </>
        ) : (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: dragging ? 'rgba(141,110,99,0.14)' : '#EFE9E7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dragging ? '#5D4037' : '#8D6E63', transition: 'all 0.2s',
            }}><CloudUpload size={26} /></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, color: '#5D4037', fontSize: '0.9rem', marginBottom: 4 }}>
                {dragging ? 'Release to drop' : 'Drop your score here'}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#9E8070', fontFamily: 'var(--font-ui)' }}>
                or click to browse · PDF only
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 99,
                background: '#EFE9E7', border: '1px solid #D7CCC8',
                fontSize: '0.68rem', fontWeight: 700, color: '#8D6E63',
              }}>PDF</span>
            </div>
          </>
        )}
      </div>

      {fileError && (
        <p id="upload-file-error" role="alert" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.8125rem', color: '#C0392B', fontFamily: 'var(--font-ui)', marginTop: -12,
        }}>
          <AlertCircle size={14} aria-hidden="true" /> {fileError}
        </p>
      )}

      {/* ── Title ── */}
      <div>
        <label htmlFor="upload-title" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5D4037', marginBottom: 6 }}>
          Title <span style={{ color: '#E57373', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>*</span>
        </label>
        <input id="upload-title" value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Sanctus in D Major — SATB"
          style={inputBase} onFocus={onFocus} onBlur={onBlur} />
      </div>

      {/* ── Description ── */}
      <div>
        <label htmlFor="upload-description" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5D4037', marginBottom: 6 }}>
          Description
        </label>
        <textarea id="upload-description" value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Composer, voice parts, key, arrangement notes…"
          rows={3}
          style={{ ...inputBase, resize: 'none' }}
          onFocus={onFocus as any} onBlur={onBlur as any} />
      </div>

      {/* ── Composer / Arranger / Voice Parts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="three-col">
        {[
          { key: 'composer',    label: 'Composer',    ph: 'e.g. Handel' },
          { key: 'arranger',    label: 'Arranger',    ph: 'e.g. John Smith' },
          { key: 'voice_parts', label: 'Voice Parts', ph: 'e.g. SATB, SSA' },
        ].map(({ key, label, ph }) => (
          <div key={key}>
            <label htmlFor={`upload-${key}`} style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5D4037', marginBottom: 6 }}>
              {label}
            </label>
            <input id={`upload-${key}`} value={(form as any)[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              placeholder={ph} style={inputBase} onFocus={onFocus} onBlur={onBlur} />
          </div>
        ))}
      </div>

      {/* ── Tags ── */}
      <div>
        <label id="upload-tags-label" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5D4037', marginBottom: 6 }}>
          Categories & Tags <span style={{ color: '#E57373', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>*</span>
        </label>
        <TagDropdown selected={form.tags}
          onChange={tags => setForm(p => ({ ...p, tags }))}
          placeholder="Select mass part, season, or occasion…"
          aria-labelledby="upload-tags-label" />
        <p style={{ marginTop: 6, fontSize: '0.75rem', color: '#9E8070', fontFamily: 'var(--font-ui)' }}>
          Pick all that apply — e.g. Communion + Easter + Meditation / Reflection
        </p>
      </div>

      {/* ── Visibility ── */}
      <div>
        <label id="upload-visibility-label" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5D4037', marginBottom: 8 }}>
          Visibility
        </label>
        <div role="radiogroup" aria-labelledby="upload-visibility-label" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { val: true,  icon: <Globe size={16} />, label: 'Public',  sub: 'Visible to everyone' },
            { val: false, icon: <Lock  size={16} />, label: 'Private', sub: 'Only visible to you' },
          ].map(opt => (
            <button key={String(opt.val)} type="button"
              role="radio" aria-checked={form.is_public === opt.val}
              onClick={() => setForm(p => ({ ...p, is_public: opt.val }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                border: `2px solid ${form.is_public === opt.val ? '#5D4037' : '#E0D8D4'}`,
                background: form.is_public === opt.val ? 'rgba(93,64,55,0.04)' : '#FAFAF9',
                transition: 'all 0.15s',
                boxShadow: form.is_public === opt.val ? '0 0 0 3px rgba(93,64,55,0.08)' : 'none',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: form.is_public === opt.val ? 'rgba(93,64,55,0.12)' : '#EFE9E7',
                color: form.is_public === opt.val ? '#5D4037' : '#8D6E63',
                transition: 'all 0.15s',
              }}>{opt.icon}</div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 2, color: form.is_public === opt.val ? '#3E2723' : '#8D6E63' }}>{opt.label}</p>
                <p style={{ fontSize: '0.72rem', color: '#9E8070', fontFamily: 'var(--font-ui)' }}>{opt.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Copyright / license status ── */}
      <div>
        <label htmlFor="upload-license" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5D4037', marginBottom: 6 }}>
          Copyright Status <span style={{ color: '#E57373', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>*</span>
        </label>
        <select
          id="upload-license"
          value={form.license_status}
          onChange={e => setForm(p => ({ ...p, license_status: e.target.value as typeof p.license_status }))}
          style={{ ...inputBase, cursor: 'pointer' }}
          onFocus={onFocus} onBlur={onBlur}
        >
          {LICENSE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p style={{ marginTop: 6, fontSize: '0.75rem', color: '#9E8070', fontFamily: 'var(--font-ui)' }}>
          {LICENSE_OPTIONS.find(o => o.value === form.license_status)?.hint}
        </p>
      </div>

      {/* ── Progress ── */}
      {status === 'uploading' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: '0.775rem', color: '#8D6E63', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…
            </span>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#5D4037' }}>{progress}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: '#EDE7E3', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, #5D4037, #8D6E63)',
              width: `${progress}%`, transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
            }} />
          </div>
        </div>
      )}

      {/* ── Alerts ── */}
      {status === 'success' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 16px', borderRadius: 12,
          background: '#F0FDF4', border: '1.5px solid #86EFAC', color: '#166534', fontSize: '0.875rem',
        }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          Uploaded successfully! Redirecting to your dashboard…
        </div>
      )}
      {status === 'error' && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '13px 16px', borderRadius: 12,
          background: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#991B1B', fontSize: '0.875rem',
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {errorMsg}
        </div>
      )}

      {/* ── Submit ── */}
      <button
        onClick={handleUpload}
        disabled={!canUpload}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px', borderRadius: 12, border: 'none',
          background: canUpload ? '#3E2723' : '#E0D8D4',
          color: canUpload ? '#F7F4F2' : '#A09080',
          cursor: canUpload ? 'pointer' : 'not-allowed',
          fontSize: '0.9375rem', fontWeight: 700,
          fontFamily: 'var(--font-ui)',
          transition: 'all 0.2s',
          boxShadow: canUpload ? '0 2px 8px rgba(62,39,35,0.22)' : 'none',
        }}
        onMouseEnter={e => { if (canUpload) (e.currentTarget as HTMLElement).style.background = '#2C1810' }}
        onMouseLeave={e => { if (canUpload) (e.currentTarget as HTMLElement).style.background = '#3E2723' }}
      >
        {status === 'uploading' ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</>
         : status === 'success'  ? <><CheckCircle2 size={17} /> Done!</>
         : <><Upload size={17} /> Upload to FaithLibrary</>}
      </button>

      {form.tags.length === 0 && file && (
        <p style={{ textAlign: 'center', fontSize: '0.775rem', color: '#9E8070', fontFamily: 'var(--font-ui)', marginTop: -8 }}>
          ↑ Select at least one category or tag to enable upload
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) { .three-col { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}