// app/(main)/collections/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { CollectionCard } from '@/components/CollectionCard'
import { CreateCollectionButton } from '@/components/CreateCollectionButton'
import { FolderOpen, Plus } from 'lucide-react'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: collections } = await supabase
    .from('collections')
    .select('*, collection_files(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      <div className="bg-white border-b border-[#D7CCC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-8
                        flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#3E2723]">
              My Collections
            </h1>
            <p className="text-[#8D6E63] mt-1 text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
              Group scores into named sets for Mass, season, or event.
            </p>
          </div>
          <CreateCollectionButton />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!collections || collections.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#EFE9E7] flex items-center
                            justify-center text-[#8D6E63]">
              <FolderOpen size={28} />
            </div>
            <p className="font-display text-xl text-[#5D4037]">No collections yet</p>
            <p className="text-sm text-[#8D6E63] max-w-xs" style={{ fontFamily: 'var(--font-ui)' }}>
              Create a collection to group scores — e.g. "Christmas Mass 2025" or "Lenten Hymns".
            </p>
            <CreateCollectionButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {collections.map((col: any, i: number) => (
              <CollectionCard key={col.id} collection={col} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}