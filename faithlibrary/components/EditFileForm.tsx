// components/EditFileForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TagDropdown } from '@/components/TagDropdown'
import { LICENSE_OPTIONS, isValidLicenseStatus, type LicenseStatus } from '@/lib/license'
import { isMp3File, AUDIO_TYPE_ERROR_MESSAGE, MAX_AUDIO_BYTES, AUDIO_SIZE_ERROR_MESSAGE } from '@/lib/validation'
import {
  Loader2, CheckCircle2, AlertCircle,
  Trash2, Save, Globe, Lock, Music, Play,
} from 'lucide-react'
import type { FileRecord } from '@/lib/types'

interface EditFileFormProps { file: FileRecord }

export function EditFileForm({ file }: EditFileFormProps) {
  const router   = useRouter()
  const supabase = createClient()

  const [title,       setTitle]       = useState(file.title)
  const [description, setDescription] = useState(file.description ?? '')
  const [lyrics,       setLyrics]      = useState(file.lyrics ?? '')
  const [tags,        setTags]        = useState<string[]>(file.tags ?? [])
  const [isPublic,    setIsPublic]    = useState(file.is_public)
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>(
    isValidLicenseStatus(file.license_status) ? file.license_status : 'unknown'
  )
  const [audioFile,        setAudioFile]        = useState<File | null>(null)
  const [audioError,       setAudioError]       = useState('')
  const [removeAudio,      setRemoveAudio]      = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [status,      setStatus]      = useState<'idle'|'success'|'error'>('idle')
  const [errorMsg,    setErrorMsg]    = useState('')

  const acceptAudioFile = (f: File) => {
    setAudioError('')
    if (!isMp3File(f)) { setAudioError(AUDIO_TYPE_ERROR_MESSAGE); return }
    if (f.size > MAX_AUDIO_BYTES) { setAudioError(AUDIO_SIZE_ERROR_MESSAGE); return }
    setAudioFile(f)
    setRemoveAudio(false)
  }

  /* ── Save ── */
  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true); setStatus('idle')

    let audioUrl: string | null | undefined = undefined // undefined = leave unchanged
    if (removeAudio) {
      audioUrl = null
    } else if (audioFile) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setErrorMsg('Not authenticated'); setStatus('error'); setSaving(false); return }

      const audioPath = `${user.id}/audio/${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`
      const { error: audioErr } = await supabase.storage
        .from('faithlibrary-files')
        .upload(audioPath, audioFile, { contentType: 'audio/mpeg', cacheControl: '3600' })
      if (audioErr) {
        setErrorMsg(`Could not upload audio: ${audioErr.message}`)
        setStatus('error'); setSaving(false); return
      }
      const { data: { publicUrl } } = supabase.storage.from('faithlibrary-files').getPublicUrl(audioPath)
      audioUrl = publicUrl
    }

    const { error } = await supabase
      .from('files')
      .update({
        title:       title.trim(),
        description: description.trim() || null,
        category:    tags[0] ?? 'General',
        tags,
        is_public:   isPublic,
        lyrics:        lyrics.trim() || null,
        lyrics_source: lyrics.trim() ? 'manual' : null,
        license_status: licenseStatus,
        ...(audioUrl !== undefined ? { audio_url: audioUrl } : {}),
      })
      .eq('id', file.id)

    if (error) { setErrorMsg(error.message); setStatus('error') }
    else        { setStatus('success'); setTimeout(() => router.push('/dashboard'), 1200) }
    setSaving(false)
  }

  /* ── Delete ── */
  const handleDelete = async () => {
    setDeleting(true)
    const storagePath = file.file_url.split('/faithlibrary-files/')[1]
    if (storagePath) {
      await supabase.storage.from('faithlibrary-files').remove([storagePath])
    }
    if (file.audio_url) {
      const audioPath = file.audio_url.split('/faithlibrary-files/')[1]
      if (audioPath) {
        await supabase.storage.from('faithlibrary-files').remove([audioPath])
      }
    }
    const { error } = await supabase.from('files').delete().eq('id', file.id)
    if (error) {
      setErrorMsg(error.message); setStatus('error')
      setDeleting(false); setConfirmDel(false); return
    }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-6 space-y-5">

      {/* Title */}
      <div>
        <label className="label">Title *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="input"
          placeholder="Score title"
        />
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="input resize-none"
          placeholder="Composer, voice parts, key…"
        />
      </div>

      {/* Lyrics — powers "search by remembered lyrics" */}
      <div>
        <label className="label">
          Lyrics <span style={{ fontWeight: 500, color: '#9E8070' }}>(optional)</span>
          {file.lyrics_source === 'ocr' && (
            <span style={{ marginLeft: 8, fontSize: '0.7rem', fontWeight: 600, color: '#8D6E63' }}>
              auto-read from the PDF — check it over
            </span>
          )}
        </label>
        <textarea
          value={lyrics}
          onChange={e => setLyrics(e.target.value)}
          rows={4}
          className="input resize-none"
          placeholder="Paste the lyrics so people can find this score by a line they remember."
        />
      </div>

      {/* Audio recording */}
      <div>
        <label className="label">
          Audio Recording <span style={{ fontWeight: 500, color: '#9E8070' }}>(optional)</span>
        </label>

        {audioFile ? (
          <div className="flex items-center gap-3 border border-[#E0D8D4] rounded-xl px-3.5 py-3 bg-[#5D4037]/5">
            <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#5D4037]/10 text-[#5D4037]">
              <Music size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#3E2723] truncate">{audioFile.name}</p>
              <p className="text-xs text-[#8D6E63]">{(audioFile.size / 1024 / 1024).toFixed(2)} MB · will replace current audio on save</p>
            </div>
            <button
              type="button"
              onClick={() => setAudioFile(null)}
              className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#F2EDE9] border border-[#D7CCC8] text-[#8D6E63]"
            ><Trash2 size={13} /></button>
          </div>
        ) : file.audio_url && !removeAudio ? (
          <div className="flex items-center gap-3 border border-[#E0D8D4] rounded-xl px-3.5 py-3">
            <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#EFE9E7] text-[#8D6E63]">
              <Play size={14} />
            </div>
            <audio controls src={file.audio_url} className="flex-1 min-w-0 h-9" style={{ maxWidth: '100%' }} />
            <label className="btn btn-secondary btn-sm cursor-pointer flex-shrink-0" style={{ padding: '0.35rem 0.7rem' }}>
              Replace
              <input type="file" accept=".mp3,audio/mpeg" className="hidden"
                onChange={e => e.target.files?.[0] && acceptAudioFile(e.target.files[0])} />
            </label>
            <button
              type="button"
              onClick={() => setRemoveAudio(true)}
              className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#F2EDE9] border border-[#D7CCC8] text-[#8D6E63]"
              title="Remove audio"
            ><Trash2 size={13} /></button>
          </div>
        ) : (
          <label className="flex items-center gap-2.5 border border-dashed border-[#C4B5AF] rounded-xl px-3.5 py-3 text-sm text-[#8D6E63] cursor-pointer bg-[#FAFAF9]">
            <Music size={16} />
            Attach an MP3 recording of this piece
            <input type="file" accept=".mp3,audio/mpeg" className="hidden"
              onChange={e => e.target.files?.[0] && acceptAudioFile(e.target.files[0])} />
          </label>
        )}
        {removeAudio && (
          <p className="mt-1.5 text-xs text-[#8D6E63]">
            Audio will be removed when you save.{' '}
            <button type="button" onClick={() => setRemoveAudio(false)} className="underline">Undo</button>
          </p>
        )}
        {audioError && <p className="mt-1.5 text-xs text-red-600">{audioError}</p>}
      </div>

      {/* Tags */}
      <div>
        <label className="label">Categories & Tags</label>
        <TagDropdown
          selected={tags}
          onChange={setTags}
          placeholder="Select categories…"
        />
      </div>

      {/* Copyright / license status */}
      <div>
        <label className="label">Copyright Status</label>
        <select
          value={licenseStatus}
          onChange={e => setLicenseStatus(e.target.value as LicenseStatus)}
          className="input"
          style={{ cursor: 'pointer' }}
        >
          {LICENSE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-[#9E8070]">
          {LICENSE_OPTIONS.find(o => o.value === licenseStatus)?.hint}
        </p>
      </div>

      {/* Visibility */}
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
              onClick={() => setIsPublic(opt.val)}
              className={`
                flex-1 flex items-start gap-2.5 p-3.5 rounded-xl border-2
                text-left transition-all duration-150
                ${isPublic === opt.val
                  ? 'border-[#5D4037] bg-[#5D4037]/5'
                  : 'border-[#D7CCC8] hover:border-[#8D6E63]'}
              `}
            >
              <div className={`mt-0.5 flex-shrink-0 ${isPublic === opt.val ? 'text-[#5D4037]' : 'text-[#8D6E63]'}`}>
                {opt.icon}
              </div>
              <div>
                <p className={`text-sm font-semibold ${isPublic === opt.val ? 'text-[#3E2723]' : 'text-[#8D6E63]'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-[#8D6E63] mt-0.5">{opt.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {status === 'success' && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                        bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 size={15} className="flex-shrink-0" />
          Saved! Redirecting to dashboard…
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                        bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" /> {errorMsg}
        </div>
      )}

      {/* Actions */}
      <div className="divider" />
      <div className="flex items-center justify-between gap-3 flex-wrap">

        {/* Delete */}
        {!confirmDel ? (
          <button onClick={() => setConfirmDel(true)}
            className="btn btn-danger btn-sm flex items-center gap-1.5">
            <Trash2 size={13} /> Delete score
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-red-600 font-medium">Delete permanently?</span>
            <button onClick={handleDelete} disabled={deleting}
              className="btn btn-sm"
              style={{background:'#dc2626', color:'white', borderColor:'#dc2626', padding:'0.35rem 0.75rem'}}>
              {deleting ? <Loader2 size={13} className="animate-spin" /> : 'Yes, delete'}
            </button>
            <button onClick={() => setConfirmDel(false)}
              className="btn btn-secondary btn-sm">
              Cancel
            </button>
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !title.trim() || status === 'success'}
          className="btn btn-primary"
          style={{padding:'0.6rem 1.5rem'}}
        >
          {saving
            ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
            : <><Save size={14} /> Save changes</>}
        </button>
      </div>
    </div>
  )
}