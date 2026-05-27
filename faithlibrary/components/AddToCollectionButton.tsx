// components/AddToCollectionButton.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FolderPlus, Check, ChevronDown, Plus, Loader2 } from 'lucide-react'

interface AddToCollectionButtonProps {
  fileId: string
}

export function AddToCollectionButton({ fileId }: AddToCollectionButtonProps) {
  const supabase = createClient()
  const [open,        setOpen]        = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [added,       setAdded]       = useState<Set<string>>(new Set())
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState<string | null>(null)
  const containerRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadCollections = async () => {
    if (collections.length > 0) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: cols } = await supabase
      .from('collections')
      .select('id, title')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: existing } = await supabase
      .from('collection_files')
      .select('collection_id')
      .eq('file_id', fileId)

    setCollections(cols ?? [])
    setAdded(new Set((existing ?? []).map((e: any) => e.collection_id)))
    setLoading(false)
  }

  const handleOpen = () => {
    setOpen(v => !v)
    if (!open) loadCollections()
  }

  const toggle = async (collectionId: string) => {
    setSaving(collectionId)
    if (added.has(collectionId)) {
      await supabase.from('collection_files')
        .delete()
        .match({ collection_id: collectionId, file_id: fileId })
      setAdded(prev => { const s = new Set(prev); s.delete(collectionId); return s })
    } else {
      const { data: pos } = await supabase
        .from('collection_files')
        .select('position')
        .eq('collection_id', collectionId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

      await supabase.from('collection_files').insert({
        collection_id: collectionId,
        file_id:       fileId,
        position:      (pos?.position ?? 0) + 1,
      })
      setAdded(prev => new Set([...prev, collectionId]))
    }
    setSaving(null)
  }

  return (
    <div ref={containerRef} className="relative">
      <button onClick={handleOpen}
        className="btn btn-secondary w-full"
        style={{ justifyContent: 'center', padding: '0.7rem' }}>
        <FolderPlus size={15} /> Add to Collection
        <ChevronDown size={13} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1.5 z-50
                        bg-white border border-[#D7CCC8] rounded-xl shadow-lift
                        animate-scale-in overflow-hidden"
          style={{ maxHeight: '260px', display: 'flex', flexDirection: 'column' }}>

          <div className="px-3 py-2 border-b border-[#EFE9E7] flex-shrink-0">
            <p className="text-xs font-semibold text-[#8D6E63] uppercase tracking-wider">
              My Collections
            </p>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-[#8D6E63]" />
              </div>
            ) : collections.length === 0 ? (
              <div className="py-4 px-3 text-center">
                <p className="text-xs text-[#8D6E63] mb-2">No collections yet</p>
                <a href="/collections"
                  className="text-xs text-[#5D4037] font-medium hover:underline">
                  Create one →
                </a>
              </div>
            ) : (
              collections.map(col => (
                <button key={col.id} onClick={() => toggle(col.id)}
                  disabled={saving === col.id}
                  className={`w-full text-left px-3 py-2.5 text-sm flex items-center
                              justify-between gap-2 transition-colors ${
                    added.has(col.id)
                      ? 'bg-[#EFE9E7] text-[#5D4037] font-medium'
                      : 'text-[#3E2723] hover:bg-[#F5F5F5]'
                  }`}>
                  <span className="truncate">{col.title}</span>
                  {saving === col.id
                    ? <Loader2 size={13} className="animate-spin flex-shrink-0" />
                    : added.has(col.id)
                    ? <Check size={13} className="text-[#5D4037] flex-shrink-0" />
                    : <Plus size={13} className="text-[#D7CCC8] flex-shrink-0" />
                  }
                </button>
              ))
            )}
          </div>

          <div className="px-3 py-2 border-t border-[#EFE9E7] flex-shrink-0">
            <a href="/collections"
              className="text-xs text-[#8D6E63] hover:text-[#5D4037] transition-colors font-medium">
              + Create new collection
            </a>
          </div>
        </div>
      )}
    </div>
  )
}