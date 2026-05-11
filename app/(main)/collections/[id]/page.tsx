// app/(main)/collections/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FileCard } from '@/components/FileCard'
import { ArrowLeft, FolderOpen } from 'lucide-react'

interface CollectionPageProps {
  params: Promise<{ id: string }>
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: collection, error } = await supabase
    .from('collections')
    .select('*, profiles(full_name)')
    .eq('id', id)
    .single()

  if (error || !collection) notFound()

  const { data: items } = await supabase
    .from('collection_files')
    .select('position, files(*)')
    .eq('collection_id', id)
    .order('position', { ascending: true })

  const files = (items ?? []).map((i: any) => i.files).filter(Boolean)

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      {/* Header */}
      <div className="bg-[#3E2723] relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full
                        bg-[#5D4037]/30 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <Link href="/collections"
            className="inline-flex items-center gap-1.5 text-[#8D6E63] text-sm mb-5
                       hover:text-[#D7CCC8] transition-colors">
            <ArrowLeft size={14} /> My Collections
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center
                            flex-shrink-0 text-white text-2xl shadow-lg"
              style={{ background: collection.cover_color ?? '#5D4037' }}>
              <FolderOpen size={26} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-[#F5F5F5]">
                {collection.title}
              </h1>
              {collection.description && (
                <p className="text-[#8D6E63] text-sm mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
                  {collection.description}
                </p>
              )}
              <p className="text-[#8D6E63] text-xs mt-2" style={{ fontFamily: 'var(--font-ui)' }}>
                {files.length} score{files.length !== 1 ? 's' : ''}
                {collection.profiles?.full_name && ` · by ${collection.profiles.full_name}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {files.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="font-display text-xl text-[#5D4037]">No scores in this collection</p>
            <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
              Browse the library and add scores to this collection.
            </p>
            <Link href="/" className="btn btn-primary btn-sm">Browse Library</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {files.map((file: any, i: number) => (
              <FileCard key={file.id} file={file} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}