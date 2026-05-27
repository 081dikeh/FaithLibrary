// components/SetScoreOfWeek.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Search, Loader2, CheckCircle2 } from 'lucide-react'

export function SetScoreOfWeek() {
  const supabase = createClient()

  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<any[]>([])
  const [note,    setNote]    = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)
  const [searching, setSearching] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    const { data } = await supabase
      .from('files')
      .select('id, title, composer, tags')
      .eq('is_public', true)
      .or(`title.ilike.%${query}%,composer.ilike.%${query}%`)
      .limit(6)
    setResults(data ?? [])
    setSearching(false)
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('score_of_week').insert({
      file_id:    selected.id,
      note:       note.trim() || null,
      created_by: user?.id,
    })

    setDone(true)
    setSaving(false)
    setTimeout(() => { setDone(false); setSelected(null); setQuery(''); setNote('') }, 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star size={15} className="text-amber-400" fill="currentColor" />
        <h2 className="font-display text-base font-semibold text-[#3E2723]">
          Score of the Week
        </h2>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search score by title or composer…"
          className="input flex-1"
        />
        <button onClick={search} disabled={searching}
          className="btn btn-secondary btn-sm flex-shrink-0">
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && !selected && (
        <div className="border border-[#D7CCC8] rounded-xl overflow-hidden mb-3">
          {results.map(file => (
            <button key={file.id} onClick={() => { setSelected(file); setResults([]) }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#EFE9E7]
                         transition-colors border-b border-[#EFE9E7] last:border-0
                         flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#3E2723] truncate">{file.title}</p>
                {file.composer && (
                  <p className="text-xs text-[#8D6E63]">{file.composer}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected score */}
      {selected && (
        <div className="bg-[#EFE9E7] rounded-xl px-4 py-3 mb-3 flex items-center gap-3">
          <Star size={14} className="text-amber-400 flex-shrink-0" fill="currentColor" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#3E2723] truncate">{selected.title}</p>
            {selected.composer && (
              <p className="text-xs text-[#8D6E63]">{selected.composer}</p>
            )}
          </div>
          <button onClick={() => setSelected(null)}
            className="text-xs text-[#8D6E63] hover:text-red-500 transition-colors">
            Change
          </button>
        </div>
      )}

      {/* Note */}
      {selected && (
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional: why is this the score of the week?"
          rows={2}
          className="input resize-none mb-3"
        />
      )}

      {/* Save */}
      <button
        onClick={save}
        disabled={!selected || saving}
        className="btn btn-primary w-full"
        style={{ padding: '0.65rem' }}
      >
        {done
          ? <><CheckCircle2 size={15} /> Set!</>
          : saving
          ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
          : <><Star size={15} /> Set as Score of the Week</>}
      </button>
    </div>
  )
}