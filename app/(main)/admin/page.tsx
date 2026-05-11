// app/(main)/admin/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { AdminStats } from '@/components/AdminStats'
import { AdminFileTable } from '@/components/AdminFileTable'
import { AdminUserTable } from '@/components/AdminUserTable'
import { Shield } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  // Platform stats
  const [
    { count: totalFiles },
    { count: totalUsers },
    { count: totalDownloads },
    { count: totalRequests },
  ] = await Promise.all([
    supabase.from('files').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('files').select('download_count.sum()' as any, { count: 'exact', head: true }),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  // Recent uploads for moderation
  const { data: recentFiles } = await supabase
    .from('files')
    .select('*, profiles(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(20)

  // Recent users
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  // Download total from all files
  const { data: dlData } = await supabase
    .from('files')
    .select('download_count')
  const totalDl = (dlData ?? []).reduce((s: number, f: any) => s + (f.download_count ?? 0), 0)

  const stats = {
    totalFiles:    totalFiles ?? 0,
    totalUsers:    totalUsers ?? 0,
    totalDownloads: totalDl,
    openRequests:  totalRequests ?? 0,
  }

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      <div className="bg-[#3E2723] border-b border-[#5D4037]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5D4037] flex items-center
                            justify-center text-[#D7CCC8]">
              <Shield size={17} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[#F5F5F5]">
                Admin Dashboard
              </h1>
              <p className="text-[#8D6E63] text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
                Platform overview and moderation
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <AdminStats stats={stats} />
        <AdminFileTable files={recentFiles ?? []} />
        <AdminUserTable users={recentUsers ?? []} />
      </main>
    </div>
  )
}