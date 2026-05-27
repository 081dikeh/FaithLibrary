// components/UploadForm.tsx
'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TagDropdown } from '@/components/TagDropdown'
import {
  Upload, X, CheckCircle2, AlertCircle,
  FileText, Loader2, Globe, Lock,
} from 'lucide-react'

interface FormState {
  title:       string
  description: string
  composer:    string
  arranger:    string
  voice_parts: string
  tags:        string[]
  is_public:   boolean
}

export function UploadForm() {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [file,     setFile]     = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status,   setStatus]   = useState<'idle'|'uploading'|'success'|'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState<FormState>({
    title: '', description: '', composer: '', arranger: '', voice_parts: '', tags: [], is_public: true,
  })

  /* ── File handling ── */
  const acceptFile = useCallback((f: File) => {
    setFile(f)
    if (!form.title) {
      setForm(prev => ({
        ...prev,
        title: f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      }))
    }
  }, [form.title])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) acceptFile(dropped)
  }

  /* ── Upload ── */
  const handleUpload = async () => {
    if (!file || !form.title.trim()) return
    setStatus('uploading'); setProgress(10); setErrorMsg('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      setProgress(25)

      const ext  = file.name.split('.').pop() ?? 'pdf'
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: storageErr } = await supabase.storage
        .from('faithlibrary-files')
        .upload(path, file, { contentType: file.type || 'application/pdf', cacheControl: '3600' })
      if (storageErr) throw storageErr

      setProgress(70)

      const { data: { publicUrl } } = supabase.storage
        .from('faithlibrary-files').getPublicUrl(path)

      // Generate thumbnail from first page
      let thumbnailUrl: string | null = null
      try {
        const { generatePdfThumbnail } = await import('@/lib/generateThumbnail')
        const thumbBlob = await generatePdfThumbnail(publicUrl, 400)
        if (thumbBlob) {
          const thumbPath = `${user.id}/thumbs/${Date.now()}.jpg`
          const { error: thumbErr } = await supabase.storage
            .from('faithlibrary-files')
            .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', cacheControl: '3600' })
          if (!thumbErr) {
            const { data: { publicUrl: tUrl } } = supabase.storage
              .from('faithlibrary-files').getPublicUrl(thumbPath)
            thumbnailUrl = tUrl
          }
        }
      } catch { /* thumbnail is optional */ }

      setProgress(88)

      const { error: dbErr } = await supabase.from('files').insert({
        user_id:       user.id,
        title:         form.title.trim(),
        description:   form.description.trim() || null,
        composer:      form.composer.trim() || null,
        arranger:      form.arranger.trim() || null,
        voice_parts:   form.voice_parts.trim() || null,
        category:      form.tags[0] ?? 'General',
        tags:          form.tags,
        is_public:     form.is_public,
        file_url:      publicUrl,
        thumbnail_url: thumbnailUrl,
      })
      if (dbErr) {
        console.error('DB insert error:', JSON.stringify(dbErr))
        throw new Error(dbErr.message + (dbErr.details ? ' — ' + dbErr.details : '') + (dbErr.hint ? ' — Hint: ' + dbErr.hint : ''))
      }

      setProgress(100); setStatus('success')
      setTimeout(() => router.push('/dashboard'), 1400)
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Upload failed. Please try again.')
      setStatus('error'); setProgress(0)
    }
  }

  const canUpload = file && form.title.trim() && form.tags.length > 0
    && status !== 'uploading' && status !== 'success'

  return (
    <div className="space-y-5">

      {/* ── Drop zone ── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 flex flex-col
          items-center justify-center gap-3 cursor-pointer
          transition-all duration-200 select-none
          ${file
            ? 'border-[#5D4037] bg-[#5D4037]/5'
            : dragging
            ? 'border-[#8D6E63] bg-[#D7CCC8]/20 scale-[1.01]'
            : 'border-[#D7CCC8] hover:border-[#8D6E63] hover:bg-[#EFE9E7]/50'}
        `}
      >
        <input
          ref={fileRef} type="file" className="hidden"
          accept=".pdf,.mxl,.xml,.musicxml"
          onChange={e => e.target.files?.[0] && acceptFile(e.target.files[0])}
        />

        {file ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-[#5D4037]/10 flex items-center
                            justify-center text-[#5D4037]">
              <FileText size={22} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[#3E2723] text-sm">{file.name}</p>
              <p className="text-xs text-[#8D6E63] mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setFile(null) }}
              className="absolute top-3 right-3 btn-icon text-[#8D6E63]"
              style={{padding:'0.35rem'}}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-[#EFE9E7] flex items-center
                            justify-center text-[#8D6E63]">
              <Upload size={22} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[#5D4037] text-sm">
                {dragging ? 'Drop to upload' : 'Drop your file here'}
              </p>
              <p className="text-xs text-[#8D6E63] mt-0.5">
                or click to browse — PDF, MXL, MusicXML
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Title ── */}
      <div>
        <label className="label">
          Title <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
        </label>
        <input
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Sanctus in D Major — SATB"
          className="input"
        />
      </div>

      {/* ── Description ── */}
      <div>
        <label className="label">Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Composer, voice parts, key, arrangement notes…"
          rows={3}
          className="input resize-none"
        />
      </div>

      {/* ── Composer / Arranger / Voice parts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Composer</label>
          <input
            value={form.composer}
            onChange={e => setForm(p => ({ ...p, composer: e.target.value }))}
            placeholder="e.g. Handel"
            className="input"
          />
        </div>
        <div>
          <label className="label">Arranger</label>
          <input
            value={form.arranger}
            onChange={e => setForm(p => ({ ...p, arranger: e.target.value }))}
            placeholder="e.g. John Smith"
            className="input"
          />
        </div>
        <div>
          <label className="label">Voice Parts</label>
          <input
            value={form.voice_parts}
            onChange={e => setForm(p => ({ ...p, voice_parts: e.target.value }))}
            placeholder="e.g. SATB, SSA, Unison"
            className="input"
          />
        </div>
      </div>

      {/* ── Category & Tags ── */}
      <div>
        <label className="label">
          Categories & Tags <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
        </label>
        <TagDropdown
          selected={form.tags}
          onChange={tags => setForm(p => ({ ...p, tags }))}
          placeholder="Select mass part, season, or occasion…"
        />
        <p className="mt-1.5 text-xs text-[#8D6E63]" style={{fontFamily:'var(--font-ui)'}}>
          Pick all that apply — e.g. Communion + Easter + Meditation / Reflection
        </p>
      </div>

      {/* ── Visibility ── */}
      <div>
        <label className="label">Visibility</label>
        <div className="flex gap-3">
          {[
            { val: true,  icon: <Globe size={14} />,  label: 'Public',  sub: 'Visible to everyone' },
            { val: false, icon: <Lock size={14} />,   label: 'Private', sub: 'Only visible to you' },
          ].map(opt => (
            <button
              key={String(opt.val)}
              type="button"
              onClick={() => setForm(p => ({ ...p, is_public: opt.val }))}
              className={`
                flex-1 flex items-start gap-2.5 p-3.5 rounded-xl border-2
                text-left transition-all duration-150
                ${form.is_public === opt.val
                  ? 'border-[#5D4037] bg-[#5D4037]/5'
                  : 'border-[#D7CCC8] hover:border-[#8D6E63]'}
              `}
            >
              <div className={`mt-0.5 flex-shrink-0 ${
                form.is_public === opt.val ? 'text-[#5D4037]' : 'text-[#8D6E63]'
              }`}>
                {opt.icon}
              </div>
              <div>
                <p className={`text-sm font-semibold ${
                  form.is_public === opt.val ? 'text-[#3E2723]' : 'text-[#8D6E63]'
                }`}>{opt.label}</p>
                <p className="text-xs text-[#8D6E63] mt-0.5">{opt.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Progress ── */}
      {status === 'uploading' && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#8D6E63]">
            <span>Uploading…</span><span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#D7CCC8] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#5D4037] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Alerts ── */}
      {status === 'success' && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                        bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          Uploaded successfully! Redirecting to your dashboard…
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                        bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" /> {errorMsg}
        </div>
      )}

      {/* ── Submit ── */}
      <button
        onClick={handleUpload}
        disabled={!canUpload}
        className="btn btn-primary w-full"
        style={{padding:'0.75rem', fontSize:'0.9375rem', borderRadius:'14px'}}
      >
        {status === 'uploading' ? (
          <><Loader2 size={16} className="animate-spin" /> Uploading…</>
        ) : status === 'success' ? (
          <><CheckCircle2 size={16} /> Done!</>
        ) : (
          <><Upload size={16} /> Upload to FaithLibrary</>
        )}
      </button>

      {form.tags.length === 0 && file && (
        <p className="text-center text-xs text-[#8D6E63]">
          ↑ Please select at least one category or tag before uploading
        </p>
      )}
    </div>
  )
}