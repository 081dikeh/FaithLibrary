// components/AdminFileTable.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Star, StarOff, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface AdminFileTableProps {
  files: any[]
}

export function AdminFileTable({ files: initialFiles }: AdminFileTableProps) {
  const supabase = createClient()
  const router   = useRouter()
  const [files, setFiles] = useState(initialFiles)

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('files').update({ is_featured: !current }).eq('id', id)
    setFiles(prev => prev.map(f => f.id === id ? { ...f, is_featured: !current } : f))
  }

  const togglePublic = async (id: string, current: boolean) => {
    await supabase.from('files').update({ is_public: !current }).eq('id', id)
    setFiles(prev => prev.map(f => f.id === id ? { ...f, is_public: !current } : f))
  }

  const deleteFile = async (id: string, fileUrl: string) => {
    if (!confirm('Delete this file permanently?')) return
    const path = fileUrl.split('/faithlibrary-files/')[1]
    if (path) await supabase.storage.from('faithlibrary-files').remove([path])
    await supabase.from('files').delete().eq('id', id)
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EFE9E7] flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-[#3E2723]">
          Recent Uploads
        </h2>
        <span className="text-xs text-[#8D6E63]">{files.length} files</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
          <thead>
            <tr className="border-b border-[#EFE9E7] bg-[#F5F5F5]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#8D6E63] uppercase tracking-wider">
                Title
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#8D6E63] uppercase tracking-wider hidden sm:table-cell">
                Uploaded by
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#8D6E63] uppercase tracking-wider hidden md:table-cell">
                Downloads
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#8D6E63] uppercase tracking-wider hidden lg:table-cell">
                Date
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[#8D6E63] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE9E7]">
            {files.map(file => (
              <tr key={file.id} className="hover:bg-[#F5F5F5] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {file.is_featured && (
                      <Star size={12} className="text-amber-400 flex-shrink-0" fill="currentColor" />
                    )}
                    <span className="font-medium text-[#3E2723] line-clamp-1 max-w-[200px]">
                      {file.title}
                    </span>
                    {!file.is_public && (
                      <span className="badge badge-sand text-[0.6rem]">Private</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#8D6E63] hidden sm:table-cell">
                  {file.profiles?.full_name ?? '—'}
                </td>
                <td className="px-4 py-3 text-[#8D6E63] hidden md:table-cell">
                  {file.download_count ?? 0}
                </td>
                <td className="px-4 py-3 text-[#8D6E63] hidden lg:table-cell">
                  {new Date(file.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/view/${file.id}`} target="_blank"
                      className="btn-icon text-[#8D6E63]" style={{ padding: '0.3rem' }}>
                      <ExternalLink size={13} />
                    </Link>
                    <button
                      onClick={() => toggleFeatured(file.id, file.is_featured)}
                      className={`btn-icon ${file.is_featured ? 'text-amber-400' : 'text-[#D7CCC8]'}`}
                      style={{ padding: '0.3rem' }}
                      title={file.is_featured ? 'Unfeature' : 'Feature'}
                    >
                      {file.is_featured ? <Star size={13} fill="currentColor" /> : <StarOff size={13} />}
                    </button>
                    <button
                      onClick={() => togglePublic(file.id, file.is_public)}
                      className="btn-icon text-[#8D6E63]"
                      style={{ padding: '0.3rem' }}
                      title={file.is_public ? 'Make private' : 'Make public'}
                    >
                      {file.is_public ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => deleteFile(file.id, file.file_url)}
                      className="btn-icon text-red-400 hover:text-red-600"
                      style={{ padding: '0.3rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

