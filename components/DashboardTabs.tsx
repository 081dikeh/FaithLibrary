// components/DashboardTabs.tsx
'use client'
import { useRouter } from 'next/navigation'
import { FileStack, Bookmark } from 'lucide-react'

const TABS = [
  { key: 'uploads',   label: 'My Uploads',  icon: <FileStack size={14} /> },
  { key: 'bookmarks', label: 'Bookmarks',   icon: <Bookmark size={14} /> },
]

export function DashboardTabs({ active }: { active: string }) {
  const router = useRouter()
  return (
    <div className="flex items-center gap-0.5 border-b border-[#D7CCC8]">
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => router.push(`/dashboard?tab=${tab.key}`)}
          className={`
            flex items-center gap-1.5 px-4 py-3 text-sm font-medium
            border-b-2 -mb-px transition-all duration-200
            ${active === tab.key
              ? 'border-[#5D4037] text-[#5D4037]'
              : 'border-transparent text-[#8D6E63] hover:text-[#5D4037] hover:border-[#D7CCC8]'}
          `}
          style={{fontFamily:'var(--font-ui)'}}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  )
}