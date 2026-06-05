// components/NewRequestButton.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TagDropdown } from '@/components/TagDropdown'
import { Plus, X, Loader2, MessageSquarePlus } from 'lucide-react'

export function NewRequestButton() {
  const router   = useRouter()
  const supabase = createClient()

  const [open,    setOpen]    = useState(false)
  const [title,   setTitle]   = useState('')
  const [desc,    setDesc]    = useState('')
  const [tags,    setTags]    = useState<string[]>([])
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true); setError('')

    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) { window.location.href = '/login'; return }

    const { error } = await supabase.from('requests').insert({
      user_id:     user.id,
      title:       title.trim(),
      description: desc.trim() || null,
      tags,
    })

    if (error) { setError(error.message); setSaving(false); return }

    setOpen(false); setTitle(''); setDesc(''); setTags([])
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary"
        style={{ padding: '0.6rem 1.25rem' }}>
        <Plus size={15} /> Request a Score
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#3E2723]/50 backdrop-blur-sm"
            onClick={() => setOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md
                          animate-scale-in overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EFE9E7] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#3E2723]">
                <MessageSquarePlus size={16} className="text-[#5D4037]" />
                <h2 className="font-display text-lg font-semibold">Request a Score</h2>
              </div>
              <button onClick={() => setOpen(false)}
                className="btn-icon text-[#8D6E63]" style={{ padding: '0.35rem' }}>
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Score title *</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Ave Maria by Schubert — SATB"
                  className="input"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">More details</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Composer, arrangement, voice parts, key…"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="label">Category / tags</label>
                <TagDropdown
                  selected={tags}
                  onChange={setTags}
                  placeholder="What type of score is this?"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button onClick={handleSubmit}
                disabled={saving || !title.trim()}
                className="btn btn-primary w-full"
                style={{ padding: '0.75rem' }}>
                {saving
                  ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                  : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}