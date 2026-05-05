// components/BulkUploadForm.tsx
'use client'
import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TagDropdown } from '@/components/TagDropdown'
import {
  Upload, X, CheckCircle2, AlertCircle,
  FileText, Loader2, Globe, Lock,
  RotateCcw, Play, Layers,
} from 'lucide-react'

type FileStatus = 'pending' | 'uploading' | 'done' | 'error'

interface QueueItem {
  id:       string
  file:     File
  title:    string
  status:   FileStatus
  progress: number
  error?:   string
}

const CONCURRENCY = 5 // upload 5 files at a time

export function BulkUploadForm() {
  const supabase  = createClient()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [queue,     setQueue]     = useState<QueueItem[]>([])
  const [tags,      setTags]      = useState<string[]>([])
  const [isPublic,  setIsPublic]  = useState(true)
  const [dragging,  setDragging]  = useState(false)
  const [running,   setRunning]   = useState(false)
  const [allDone,   setAllDone]   = useState(false)

  // ── Add files to queue ────────────────────────────────────────────────────
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    const accepted = arr.filter(f =>
      /\.(pdf|mxl|xml|musicxml)$/i.test(f.name)
    )
    const items: QueueItem[] = accepted.map(f => ({
      id:       Math.random().toString(36).slice(2),
      file:     f,
      title:    f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      status:   'pending',
      progress: 0,
    }))
    setQueue(prev => [...prev, ...items])
    setAllDone(false)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const updateItem = (id: string, patch: Partial<QueueItem>) =>
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))

  const removeItem = (id: string) =>
    setQueue(prev => prev.filter(item => item.id !== id))

  const updateTitle = (id: string, title: string) =>
    updateItem(id, { title })

  // ── Upload a single file ──────────────────────────────────────────────────
  const uploadOne = async (item: QueueItem, userId: string): Promise<void> => {
    updateItem(item.id, { status: 'uploading', progress: 10 })

    try {
      const ext  = item.file.name.split('.').pop() ?? 'pdf'
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: storageErr } = await supabase.storage
        .from('faithlibrary-files')
        .upload(path, item.file, {
          contentType: item.file.type || 'application/pdf',
          cacheControl: '3600',
        })
      if (storageErr) throw storageErr

      updateItem(item.id, { progress: 70 })

      const { data: { publicUrl } } = supabase.storage
        .from('faithlibrary-files')
        .getPublicUrl(path)

      const { error: dbErr } = await supabase.from('files').insert({
        user_id:     userId,
        title:       item.title.trim() || item.file.name,
        description: null,
        category:    tags[0] ?? 'General',
        tags,
        is_public:   isPublic,
        file_url:    publicUrl,
      })
      if (dbErr) throw new Error(dbErr.message)

      updateItem(item.id, { status: 'done', progress: 100 })
    } catch (err: any) {
      updateItem(item.id, { status: 'error', progress: 0, error: err.message ?? 'Upload failed' })
    }
  }

  // ── Run the queue with concurrency limit ──────────────────────────────────
  const runQueue = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    setRunning(true)
    setAllDone(false)

    const pending = queue.filter(item =>
      item.status === 'pending' || item.status === 'error'
    )

    // Reset errors to pending for retry
    pending.forEach(item => {
      if (item.status === 'error') updateItem(item.id, { status: 'pending', error: undefined })
    })

    // Process in batches of CONCURRENCY
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      const batch = pending.slice(i, i + CONCURRENCY)
      await Promise.all(batch.map(item => uploadOne(item, user.id)))
    }

    setRunning(false)
    setAllDone(true)
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total    = queue.length
  const done     = queue.filter(q => q.status === 'done').length
  const errors   = queue.filter(q => q.status === 'error').length
  const pending  = queue.filter(q => q.status === 'pending').length
  const uploading = queue.filter(q => q.status === 'uploading').length
  const hasRetriable = errors > 0 && !running
  const canStart = pending > 0 && !running && tags.length > 0

  return (
    <div className="space-y-5">

      {/* ── Drop zone ── */}
      {!running && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-8 flex flex-col items-center
            justify-center gap-3 cursor-pointer transition-all duration-200 select-none
            ${dragging
              ? 'border-[#8D6E63] bg-[#D7CCC8]/20 scale-[1.01]'
              : 'border-[#D7CCC8] hover:border-[#8D6E63] hover:bg-[#EFE9E7]/50'}
          `}
        >
          <input
            ref={fileRef} type="file" className="hidden" multiple
            accept=".pdf,.mxl,.xml,.musicxml"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
          <div className="w-14 h-14 rounded-xl bg-[#EFE9E7] flex items-center
                          justify-center text-[#8D6E63]">
            <Layers size={26} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#5D4037] text-sm">
              {dragging ? 'Drop files here' : 'Drop multiple files or click to browse'}
            </p>
            <p className="text-xs text-[#8D6E63] mt-0.5">
              Select up to 100 PDF, MXL, or MusicXML files at once
            </p>
          </div>
        </div>
      )}

      {/* ── Shared settings ── */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-5 space-y-4">
          <p className="text-sm font-semibold text-[#3E2723]" style={{ fontFamily: 'var(--font-ui)' }}>
            Shared settings — applied to all {total} files
          </p>

          {/* Tags */}
          <div>
            <label className="label">
              Categories & Tags <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
            </label>
            <TagDropdown
              selected={tags}
              onChange={setTags}
              placeholder="Select categories for all files…"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="label">Visibility</label>
            <div className="flex gap-3">
              {[
                { val: true,  icon: <Globe size={13} />,  label: 'Public',  sub: 'Visible to everyone' },
                { val: false, icon: <Lock size={13} />,   label: 'Private', sub: 'Only visible to you' },
              ].map(opt => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => setIsPublic(opt.val)}
                  className={`
                    flex-1 flex items-start gap-2 p-3 rounded-xl border-2 text-left
                    transition-all duration-150
                    ${isPublic === opt.val
                      ? 'border-[#5D4037] bg-[#5D4037]/5'
                      : 'border-[#D7CCC8] hover:border-[#8D6E63]'}
                  `}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${isPublic === opt.val ? 'text-[#5D4037]' : 'text-[#8D6E63]'}`}>
                    {opt.icon}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isPublic === opt.val ? 'text-[#3E2723]' : 'text-[#8D6E63]'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-[#8D6E63] mt-0.5">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Progress summary ── */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
                <strong className="text-[#3E2723]">{total}</strong> files
              </span>
              {done > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 size={13} /> {done} done
                </span>
              )}
              {uploading > 0 && (
                <span className="flex items-center gap-1 text-[#8D6E63]">
                  <Loader2 size={13} className="animate-spin" /> {uploading} uploading
                </span>
              )}
              {errors > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle size={13} /> {errors} failed
                </span>
              )}
              {pending > 0 && !running && (
                <span className="text-[#8D6E63]">{pending} pending</span>
              )}
            </div>

            {/* Progress bar */}
            {total > 0 && (
              <div className="flex-1 min-w-32">
                <div className="h-1.5 rounded-full bg-[#D7CCC8] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#5D4037] transition-all duration-500"
                    style={{ width: `${Math.round((done / total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[#8D6E63] mt-1 text-right">
                  {Math.round((done / total) * 100)}%
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EFE9E7] flex-wrap">
            {canStart && (
              <button onClick={runQueue} className="btn btn-primary btn-sm">
                <Play size={13} /> Upload {pending} file{pending !== 1 ? 's' : ''}
              </button>
            )}
            {hasRetriable && (
              <button onClick={runQueue} className="btn btn-secondary btn-sm">
                <RotateCcw size={13} /> Retry {errors} failed
              </button>
            )}
            {running && (
              <div className="flex items-center gap-2 text-sm text-[#8D6E63]"
                style={{ fontFamily: 'var(--font-ui)' }}>
                <Loader2 size={14} className="animate-spin" />
                Uploading… ({uploading} active)
              </div>
            )}
            {allDone && errors === 0 && (
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle2 size={14} /> All files uploaded successfully!
              </div>
            )}
            {!running && total > 0 && (
              <button
                onClick={() => { setQueue([]); setAllDone(false) }}
                className="btn btn-ghost btn-sm ml-auto text-[#8D6E63]"
              >
                Clear all
              </button>
            )}
            {tags.length === 0 && pending > 0 && (
              <p className="text-xs text-red-500 w-full mt-1">
                ↑ Select at least one category before uploading
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── File queue list ── */}
      {queue.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#EFE9E7] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#3E2723]" style={{ fontFamily: 'var(--font-ui)' }}>
              File queue
            </p>
            <p className="text-xs text-[#8D6E63]">{total} files</p>
          </div>

          <div className="divide-y divide-[#EFE9E7] max-h-[480px] overflow-y-auto">
            {queue.map(item => (
              <div key={item.id}
                className="flex items-center gap-3 px-4 py-3">

                {/* Status icon */}
                <div className="flex-shrink-0 w-6 flex items-center justify-center">
                  {item.status === 'done' && (
                    <CheckCircle2 size={16} className="text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle size={16} className="text-red-500" />
                  )}
                  {item.status === 'uploading' && (
                    <Loader2 size={16} className="text-[#8D6E63] animate-spin" />
                  )}
                  {item.status === 'pending' && (
                    <FileText size={16} className="text-[#D7CCC8]" />
                  )}
                </div>

                {/* Title input */}
                <div className="flex-1 min-w-0">
                  <input
                    value={item.title}
                    onChange={e => updateTitle(item.id, e.target.value)}
                    disabled={item.status === 'uploading' || item.status === 'done'}
                    className="w-full text-sm text-[#3E2723] bg-transparent border-none
                               outline-none focus:bg-[#F5F5F5] focus:px-2 focus:rounded-lg
                               transition-all disabled:text-[#8D6E63] truncate"
                    style={{ fontFamily: 'var(--font-ui)' }}
                  />
                  {item.status === 'error' && item.error && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">{item.error}</p>
                  )}
                  {item.status === 'uploading' && (
                    <div className="h-0.5 rounded-full bg-[#D7CCC8] mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#5D4037] transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* File size */}
                <span className="text-xs text-[#D7CCC8] flex-shrink-0 hidden sm:block">
                  {(item.file.size / 1024 / 1024).toFixed(1)}MB
                </span>

                {/* Remove */}
                {item.status !== 'uploading' && item.status !== 'done' && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="btn-icon flex-shrink-0 text-[#D7CCC8] hover:text-red-400"
                    style={{ padding: '0.25rem' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}