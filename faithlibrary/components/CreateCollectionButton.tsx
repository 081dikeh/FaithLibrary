// components/CreateCollectionButton.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Loader2, Globe, Lock } from 'lucide-react'

const COVER_COLORS = [
  '#5D4037', '#3E2723', '#8D6E63', '#4A148C',
  '#1B5E20', '#E65100', '#880E4F', '#01579B',
  '#33691E', '#BF360C', '#37474F', '#F57F17',
]

export function CreateCollectionButton() {
  const router   = useRouter()
  const supabase = createClient()

  const [open,     setOpen]     = useState(false)
  const [title,    setTitle]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [color,    setColor]    = useState(COVER_COLORS[0])
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const handleCreate = async () => {
    if (!title.trim()) return
    setSaving(true); setError('')

    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) { window.location.href = '/login'; return }

    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id:     user.id,
        title:       title.trim(),
        description: desc.trim() || null,
        is_public:   isPublic,
        cover_color: color,
      })
      .select()
      .single()

    if (error) { setError(error.message); setSaving(false); return }

    setOpen(false); setTitle(''); setDesc('')
    router.push(`/collections/${data.id}`)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="btn btn-primary"
        style={{ padding: '0.6rem 1.25rem' }}>
        <Plus size={15} /> New Collection
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#3E2723]/50 backdrop-blur-sm"
            onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md
                          animate-scale-in overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#EFE9E7] flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[#3E2723]">
                New Collection
              </h2>
              <button onClick={() => setOpen(false)}
                className="btn-icon text-[#8D6E63]" style={{ padding: '0.35rem' }}>
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Color picker */}
              <div>
                <label className="label">Cover colour</label>
                <div className="flex flex-wrap gap-2">
                  {COVER_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg transition-all duration-150 ${
                        color === c ? 'ring-2 ring-offset-2 ring-[#5D4037] scale-110' : 'hover:scale-105'
                      }`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="label">Title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Christmas Mass 2025"
                  className="input"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Optional — what's this collection for?"
                  rows={2}
                  className="input resize-none"
                />
              </div>

              {/* Visibility */}
              <div className="flex gap-3">
                {[
                  { val: true,  icon: <Globe size={13} />,  label: 'Public' },
                  { val: false, icon: <Lock size={13} />,   label: 'Private' },
                ].map(opt => (
                  <button key={String(opt.val)} onClick={() => setIsPublic(opt.val)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                                border-2 text-sm font-medium transition-all ${
                      isPublic === opt.val
                        ? 'border-[#5D4037] bg-[#5D4037]/5 text-[#5D4037]'
                        : 'border-[#D7CCC8] text-[#8D6E63] hover:border-[#8D6E63]'
                    }`}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button onClick={handleCreate}
                disabled={saving || !title.trim()}
                className="btn btn-primary w-full"
                style={{ padding: '0.75rem' }}>
                {saving
                  ? <><Loader2 size={15} className="animate-spin" /> Creating…</>
                  : 'Create Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}