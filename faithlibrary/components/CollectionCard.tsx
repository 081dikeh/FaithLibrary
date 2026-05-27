// components/CollectionCard.tsx
'use client'
import Link from 'next/link'
import { FolderOpen, Music2, Globe, Lock } from 'lucide-react'

interface CollectionCardProps {
  collection: {
    id: string
    title: string
    description: string | null
    is_public: boolean
    cover_color: string | null
    created_at: string
    collection_files: { count: number }[]
  }
  index?: number
}

export function CollectionCard({ collection, index = 0 }: CollectionCardProps) {
  const count   = collection.collection_files?.[0]?.count ?? 0
  const delays  = ['', 'delay-50', 'delay-100', 'delay-150', 'delay-200', 'delay-250']
  const delay   = delays[index % 6]
  const color   = collection.cover_color ?? '#5D4037'

  return (
    <Link href={`/collections/${collection.id}`}
      className={`card group flex flex-col animate-fade-up ${delay} hover:no-underline`}
      style={{ animationFillMode: 'forwards' }}
    >
      {/* Cover */}
      <div className="h-36 flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}dd, ${color}88)` }}>
        {/* Music lines decoration */}
        <div className="absolute inset-0 flex flex-col justify-center gap-3 px-6 opacity-10">
          {[...Array(5)].map((_, i) => <div key={i} className="h-px bg-white" />)}
        </div>
        <FolderOpen size={36} className="text-white relative z-10 opacity-80
                                         group-hover:opacity-100 transition-opacity" />

        {/* Visibility badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1
                        bg-black/20 text-white/80 text-[0.65rem] px-2 py-0.5 rounded-full">
          {collection.is_public ? <Globe size={9} /> : <Lock size={9} />}
          {collection.is_public ? 'Public' : 'Private'}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-[#3E2723] text-base
                       leading-snug group-hover:text-[#5D4037] transition-colors mb-1">
          {collection.title}
        </h3>
        {collection.description && (
          <p className="text-xs text-[#8D6E63] line-clamp-2 leading-relaxed mb-3"
            style={{ fontFamily: 'var(--font-ui)' }}>
            {collection.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1.5 text-[#8D6E63] text-xs"
          style={{ fontFamily: 'var(--font-ui)' }}>
          <Music2 size={11} />
          {count} score{count !== 1 ? 's' : ''}
        </div>
      </div>
    </Link>
  )
}