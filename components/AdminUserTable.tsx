// components/AdminUserTable.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, User } from 'lucide-react'

interface AdminUserTableProps {
  users: any[]
}

export function AdminUserTable({ users: initialUsers }: AdminUserTableProps) {
  const supabase = createClient()
  const [users, setUsers] = useState(initialUsers)
  const [saving, setSaving] = useState<string | null>(null)

  const setRole = async (userId: string, role: string) => {
    setSaving(userId)
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    setSaving(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EFE9E7] flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-[#3E2723]">
          Recent Users
        </h2>
        <span className="text-xs text-[#8D6E63]">{users.length} users</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
          <thead>
            <tr className="border-b border-[#EFE9E7] bg-[#F5F5F5]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#8D6E63] uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#8D6E63] uppercase tracking-wider hidden sm:table-cell">
                Joined
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[#8D6E63] uppercase tracking-wider">
                Role
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE9E7]">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-[#F5F5F5] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#EFE9E7] flex items-center
                                    justify-center text-[#8D6E63] flex-shrink-0 text-xs font-bold">
                      {user.full_name
                        ? user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                        : <User size={13} />}
                    </div>
                    <div>
                      <p className="font-medium text-[#3E2723]">
                        {user.full_name ?? 'Unnamed'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#8D6E63] hidden sm:table-cell">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <select
                    value={user.role ?? 'user'}
                    onChange={e => setRole(user.id, e.target.value)}
                    disabled={saving === user.id}
                    className={`text-xs border rounded-lg px-2 py-1 outline-none
                                transition-colors focus:border-[#5D4037] ${
                      user.role === 'admin'
                        ? 'border-[#5D4037] bg-[#5D4037]/10 text-[#5D4037] font-semibold'
                        : user.role === 'moderator'
                        ? 'border-[#8D6E63] bg-[#8D6E63]/10 text-[#8D6E63]'
                        : 'border-[#D7CCC8] text-[#8D6E63]'
                    }`}
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}