// components/DashboardFileCard.tsx
'use client'
import Link from 'next/link'
import { FileCard } from '@/components/FileCard'
import { Pencil, Globe, Lock } from 'lucide-react'
import type { FileRecord } from '@/lib/types'

interface DashboardFileCardProps {
  file: FileRecord
  bookmarked?: boolean
  index?: number
}

export function DashboardFileCard({ file, bookmarked, index }: DashboardFileCardProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FileCard file={file} bookmarked={bookmarked} index={index} />

      {/* Owner bar */}
      <div className="flex items-center justify-between px-1">
        <div className={`flex items-center gap-1 text-xs font-medium ${
          file.is_public ? 'text-[#8D6E63]' : 'text-[#D7CCC8]'
        }`} style={{fontFamily:'var(--font-ui)'}}>
          {file.is_public
            ? <><Globe size={10} /> Public</>
            : <><Lock size={10} /> Private</>
          }
        </div>
        <Link href={`/edit/${file.id}`}
          className="flex items-center gap-1 text-xs font-medium text-[#8D6E63]
                     hover:text-[#5D4037] transition-colors px-2 py-1
                     rounded-lg hover:bg-[#EFE9E7]"
          style={{fontFamily:'var(--font-ui)'}}>
          <Pencil size={10} /> Edit
        </Link>
      </div>
    </div>
  )
}