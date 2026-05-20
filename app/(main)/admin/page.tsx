// app/(main)/admin/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { AdminStats } from '@/components/AdminStats'
import { AdminFileTable } from '@/components/AdminFileTable'
import { AdminUserTable } from '@/components/AdminUserTable'
import { AdminRequestsTable } from '@/components/AdminRequestsTable'
import { SetScoreOfWeek } from '@/components/SetScoreOfWeek'
import { Shield } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'moderator') redirect('/')

  const isAdmin = profile?.role === 'admin'

  // Stats
  const [
    { count: totalFiles },
    { count: totalUsers },
    { count: openRequests },
  ] = await Promise.all([
    supabase.from('files').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  const { data: dlData } = await supabase.from('files').select('download_count')
  const totalDl = (dlData ?? []).reduce((s, f) => s + (f.download_count ?? 0), 0)

  const stats = {
    totalFiles:     totalFiles ?? 0,
    totalUsers:     totalUsers ?? 0,
    totalDownloads: totalDl,
    openRequests:   openRequests ?? 0,
  }

  // Recent files
  const { data: recentFiles } = await supabase
    .from('files')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(25)

  // Recent users (admin only)
  const { data: recentUsers } = isAdmin ? await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
    : { data: [] }

  // Requests
  const { data: requests } = await supabase
    .from('requests')
    .select('*, profiles(full_name)')
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      {/* Header */}
      <div className="bg-[#3E2723] border-b border-[#5D4037]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5D4037] flex items-center
                            justify-center text-[#D7CCC8]">
              <Shield size={17} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[#F5F5F5]">
                {isAdmin ? 'Admin' : 'Moderator'} Dashboard
              </h1>
              <p className="text-[#8D6E63] text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
                Platform overview and moderation tools
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Stats */}
        <AdminStats stats={stats} />

        {/* Two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Requests */}
            <AdminRequestsTable requests={requests ?? []} />

            {/* Files */}
            <AdminFileTable files={recentFiles ?? []} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Score of the week */}
            <SetScoreOfWeek />

            {/* Users — admin only */}
            {isAdmin && <AdminUserTable users={recentUsers ?? []} />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}