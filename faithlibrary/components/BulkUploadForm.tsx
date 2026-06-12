// components/BulkUploadForm.tsx — UI only, all logic identical to original
'use client'
import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TagDropdown } from '@/components/TagDropdown'
import {
  Upload, X, CheckCircle2, AlertCircle, FileText,
  Loader2, Globe, Lock, RotateCcw, Play, Layers, CloudUpload,
} from 'lucide-react'

type FileStatus = 'pending' | 'uploading' | 'done' | 'error'
interface QueueItem { id: string; file: File; title: string; status: FileStatus; progress: number; error?: string }

const CONCURRENCY = 5

export function BulkUploadForm() {
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [queue,    setQueue]    = useState<QueueItem[]>([])
  const [tags,     setTags]     = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [running,  setRunning]  = useState(false)
  const [allDone,  setAllDone]  = useState(false)

  const addFiles = useCallback((files: FileList | File[]) => {
    const items: QueueItem[] = Array.from(files)
      .filter(f => /\.(pdf|mxl|xml|musicxml)$/i.test(f.name))
      .map(f => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        title: f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        status: 'pending' as FileStatus,
        progress: 0,
      }))
    setQueue(prev => [...prev, ...items])
    setAllDone(false)
  }, [])

  const updateItem = (id: string, patch: Partial<QueueItem>) =>
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))

  const uploadOne = async (item: QueueItem, userId: string) => {
    updateItem(item.id, { status: 'uploading', progress: 15 })
    try {
      const ext  = item.file.name.split('.').pop() ?? 'pdf'
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: se } = await supabase.storage
        .from('faithlibrary-files')
        .upload(path, item.file, { contentType: item.file.type || 'application/pdf' })
      if (se) throw se
      updateItem(item.id, { progress: 60 })
      const { data: { publicUrl } } = supabase.storage.from('faithlibrary-files').getPublicUrl(path)
      let thumbnailUrl: string | null = null
      try {
        const { generatePdfThumbnail } = await import('@/lib/generateThumbnail')
        const blob = await generatePdfThumbnail(publicUrl, 400)
        if (blob) {
          const tp = `${userId}/thumbs/${Date.now()}.jpg`
          const { error: te } = await supabase.storage.from('faithlibrary-files').upload(tp, blob, { contentType: 'image/jpeg' })
          if (!te) {
            const { data: { publicUrl: tu } } = supabase.storage.from('faithlibrary-files').getPublicUrl(tp)
            thumbnailUrl = tu
          }
        }
      } catch { /* optional */ }
      updateItem(item.id, { progress: 85 })
      const { error: de } = await supabase.from('files').insert({
        user_id: userId, title: item.title.trim() || item.file.name,
        category: tags[0] ?? 'General', tags, is_public: isPublic,
        file_url: publicUrl, thumbnail_url: thumbnailUrl,
      })
      if (de) throw new Error(de.message)
      updateItem(item.id, { status: 'done', progress: 100 })
    } catch (err: any) {
      updateItem(item.id, { status: 'error', progress: 0, error: err.message ?? 'Upload failed' })
    }
  }

  const runQueue = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setRunning(true); setAllDone(false)
    const pending = queue.filter(i => i.status === 'pending' || i.status === 'error')
    pending.forEach(i => { if (i.status === 'error') updateItem(i.id, { status: 'pending', error: undefined }) })
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      await Promise.all(pending.slice(i, i + CONCURRENCY).map(item => uploadOne(item, user.id)))
    }
    setRunning(false); setAllDone(true)
  }

  const total     = queue.length
  const done      = queue.filter(q => q.status === 'done').length
  const errors    = queue.filter(q => q.status === 'error').length
  const pending   = queue.filter(q => q.status === 'pending').length
  const uploading = queue.filter(q => q.status === 'uploading').length
  const canStart  = pending > 0 && !running && tags.length > 0
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0

  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 18,
    border: '1px solid #E8E0DC',
    boxShadow: '0 1px 3px rgba(62,39,35,0.05), 0 6px 20px rgba(62,39,35,0.07)',
    overflow: 'hidden',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Drop zone ── */}
      {!running && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#8D6E63' : '#C4B5AF'}`,
            borderRadius: 16, padding: '36px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12,
            cursor: 'pointer', userSelect: 'none',
            background: dragging ? 'rgba(141,110,99,0.06)' : '#FAFAF9',
            transform: dragging ? 'scale(1.01)' : 'scale(1)',
            transition: 'all 0.2s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <input ref={fileRef} type="file" style={{ display: 'none' }} multiple
            accept=".pdf,.mxl,.xml,.musicxml"
            onChange={e => e.target.files && addFiles(e.target.files)} />

          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: dragging ? 'rgba(141,110,99,0.14)' : '#EFE9E7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: dragging ? '#5D4037' : '#8D6E63', transition: 'all 0.2s',
          }}><CloudUpload size={26} /></div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: '#5D4037', fontSize: '0.9rem', marginBottom: 4 }}>
              {dragging ? 'Release to drop files' : 'Drop multiple files or click to browse'}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#9E8070', fontFamily: 'var(--font-ui)' }}>
              PDF, MXL, MusicXML · up to 100 files at once
            </p>
          </div>

          {total > 0 && (
            <span style={{
              marginTop: 4, padding: '4px 14px', borderRadius: 99,
              background: '#F2EDE9', border: '1px solid #D7CCC8',
              fontSize: '0.75rem', fontWeight: 700, color: '#5D4037',
            }}>+ Add more files</span>
          )}
        </div>
      )}

      {/* ── Shared settings ── */}
      {total > 0 && (
        <div style={cardStyle}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #F0EAE6',
            background: '#FAFAF9', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Layers size={13} style={{ color: '#8D6E63' }} />
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3E2723' }}>
              Shared settings — applied to all {total} file{total !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5D4037', marginBottom: 6 }}>
                Categories & Tags <span style={{ color: '#E57373', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>*</span>
              </label>
              <TagDropdown selected={tags} onChange={setTags}
                placeholder="Select categories for all files…" />
            </div>

            {/* Visibility */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5D4037', marginBottom: 8 }}>
                Visibility
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { val: true,  icon: <Globe size={15} />, label: 'Public',  sub: 'Visible to everyone' },
                  { val: false, icon: <Lock  size={15} />, label: 'Private', sub: 'Only visible to you'  },
                ].map(opt => (
                  <button key={String(opt.val)} type="button"
                    onClick={() => setIsPublic(opt.val)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px', borderRadius: 11, textAlign: 'left', cursor: 'pointer',
                      border: `2px solid ${isPublic === opt.val ? '#5D4037' : '#E0D8D4'}`,
                      background: isPublic === opt.val ? 'rgba(93,64,55,0.04)' : '#FAFAF9',
                      transition: 'all 0.15s',
                      boxShadow: isPublic === opt.val ? '0 0 0 3px rgba(93,64,55,0.08)' : 'none',
                    }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isPublic === opt.val ? 'rgba(93,64,55,0.12)' : '#EFE9E7',
                      color: isPublic === opt.val ? '#5D4037' : '#8D6E63', transition: 'all 0.15s',
                    }}>{opt.icon}</div>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: isPublic === opt.val ? '#3E2723' : '#8D6E63', marginBottom: 2 }}>{opt.label}</p>
                      <p style={{ fontSize: '0.72rem', color: '#9E8070', fontFamily: 'var(--font-ui)' }}>{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Progress + actions ── */}
      {total > 0 && (
        <div style={{ ...cardStyle, padding: '18px 20px' }}>
          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#3E2723' }}>
                {total} file{total !== 1 ? 's' : ''}
              </span>
              {done > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#16A34A' }}>
                  <CheckCircle2 size={13} /> {done} done
                </span>
              )}
              {uploading > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#8D6E63' }}>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> {uploading} uploading
                </span>
              )}
              {errors > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#DC2626' }}>
                  <AlertCircle size={13} /> {errors} failed
                </span>
              )}
              {pending > 0 && !running && (
                <span style={{ fontSize: '0.8rem', color: '#9E8070' }}>{pending} pending</span>
              )}
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#5D4037' }}>{pct}%</span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 99, background: '#EDE7E3', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: errors > 0
                ? 'linear-gradient(90deg, #5D4037 0%, #DC2626 100%)'
                : 'linear-gradient(90deg, #5D4037 0%, #8D6E63 100%)',
              width: `${pct}%`, transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
            }} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #F0EAE6', paddingTop: 14 }}>
            {canStart && (
              <button onClick={runQueue} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 10,
                background: '#3E2723', color: '#F7F4F2', border: 'none',
                cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700,
                fontFamily: 'var(--font-ui)',
                boxShadow: '0 2px 8px rgba(62,39,35,0.22)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2C1810' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#3E2723' }}
              >
                <Play size={13} /> Upload {pending} file{pending !== 1 ? 's' : ''}
              </button>
            )}

            {errors > 0 && !running && (
              <button onClick={runQueue} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10,
                background: '#FEF2F2', color: '#991B1B',
                border: '1.5px solid #FCA5A5', cursor: 'pointer',
                fontSize: '0.8125rem', fontWeight: 600,
                fontFamily: 'var(--font-ui)',
              }}>
                <RotateCcw size={12} /> Retry {errors} failed
              </button>
            )}

            {running && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: '#8D6E63', fontFamily: 'var(--font-ui)' }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Uploading… ({uploading} active)
              </div>
            )}

            {allDone && errors === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 700, color: '#16A34A' }}>
                <CheckCircle2 size={14} /> All files uploaded!
              </div>
            )}

            {!running && total > 0 && (
              <button onClick={() => { setQueue([]); setAllDone(false) }} style={{
                marginLeft: 'auto', padding: '9px 14px', borderRadius: 10,
                background: 'transparent', border: '1px solid #E0D8D4',
                color: '#9E8070', cursor: 'pointer',
                fontSize: '0.8rem', fontFamily: 'var(--font-ui)',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#C4B5AF'; el.style.color = '#5D4037' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E0D8D4'; el.style.color = '#9E8070' }}
              >Clear all</button>
            )}

            {tags.length === 0 && pending > 0 && (
              <p style={{ width: '100%', fontSize: '0.775rem', color: '#DC2626', marginTop: 2, fontFamily: 'var(--font-ui)' }}>
                ↑ Select at least one category before uploading
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── File queue ── */}
      {queue.length > 0 && (
        <div style={cardStyle}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #F0EAE6',
            background: '#FAFAF9', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={13} style={{ color: '#8D6E63' }} />
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3E2723' }}>File queue</p>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#9E8070' }}>{total} files</p>
          </div>

          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {queue.map((item, idx) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 20px',
                borderBottom: idx < queue.length - 1 ? '1px solid #F7F4F2' : 'none',
                background:
                  item.status === 'done'  ? 'rgba(22,163,74,0.03)' :
                  item.status === 'error' ? 'rgba(220,38,38,0.03)' : 'transparent',
              }}>
                {/* Status icon */}
                <div style={{ width: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.status === 'done'      && <CheckCircle2 size={15} style={{ color: '#16A34A' }} />}
                  {item.status === 'error'     && <AlertCircle  size={15} style={{ color: '#DC2626' }} />}
                  {item.status === 'uploading' && <Loader2      size={15} style={{ color: '#8D6E63', animation: 'spin 1s linear infinite' }} />}
                  {item.status === 'pending'   && <FileText     size={15} style={{ color: '#C4B5AF' }} />}
                </div>

                {/* Title + progress */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={item.title}
                    onChange={e => updateItem(item.id, { title: e.target.value })}
                    disabled={item.status === 'uploading' || item.status === 'done'}
                    style={{
                      width: '100%', fontSize: '0.8125rem', color: '#3E2723',
                      background: 'transparent', border: 'none', outline: 'none',
                      fontFamily: 'var(--font-ui)', padding: '2px 4px', borderRadius: 6,
                      cursor: (item.status === 'uploading' || item.status === 'done') ? 'default' : 'text',
                      opacity: (item.status === 'done' || item.status === 'uploading') ? 0.55 : 1,
                      transition: 'background 0.15s',
                    }}
                    onFocus={e => { e.target.style.background = '#F7F4F2' }}
                    onBlur={e => { e.target.style.background = 'transparent' }}
                  />
                  {item.status === 'error' && item.error && (
                    <p style={{ fontSize: '0.7rem', color: '#DC2626', marginTop: 2, paddingLeft: 4 }}>
                      {item.error}
                    </p>
                  )}
                  {item.status === 'uploading' && (
                    <div style={{ height: 3, borderRadius: 99, background: '#EDE7E3', marginTop: 5, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        background: 'linear-gradient(90deg, #5D4037, #8D6E63)',
                        width: `${item.progress}%`, transition: 'width 0.3s ease',
                      }} />
                    </div>
                  )}
                </div>

                {/* File size */}
                <span style={{ fontSize: '0.7rem', color: '#C4B5AF', flexShrink: 0 }}>
                  {(item.file.size / 1024 / 1024).toFixed(1)} MB
                </span>

                {/* Remove */}
                {item.status !== 'uploading' && item.status !== 'done' && (
                  <button
                    onClick={() => setQueue(prev => prev.filter(i => i.id !== item.id))}
                    style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', border: 'none',
                      color: '#C4B5AF', cursor: 'pointer', transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#DC2626' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#C4B5AF' }}
                  ><X size={13} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}