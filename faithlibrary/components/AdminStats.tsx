// components/AdminStats.tsx
import { FileStack, Users, Download, MessageSquarePlus } from 'lucide-react'

interface AdminStatsProps {
  stats: {
    totalFiles:     number
    totalUsers:     number
    totalDownloads: number
    openRequests:   number
  }
}

export function AdminStats({ stats }: AdminStatsProps) {
  const cards = [
    { icon: <FileStack size={20} />, label: 'Total Scores',    value: stats.totalFiles.toLocaleString() },
    { icon: <Users size={20} />,     label: 'Users',           value: stats.totalUsers.toLocaleString() },
    { icon: <Download size={20} />,  label: 'Total Downloads', value: stats.totalDownloads.toLocaleString() },
    { icon: <MessageSquarePlus size={20} />, label: 'Open Requests', value: stats.openRequests.toLocaleString() },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label}
          className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#EFE9E7] flex items-center
                            justify-center text-[#5D4037]">
              {card.icon}
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-[#3E2723]">{card.value}</p>
          <p className="text-sm text-[#8D6E63] mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
            {card.label}
          </p>
        </div>
      ))}
    </div>
  )
}