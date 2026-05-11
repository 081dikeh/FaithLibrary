// app/(main)/requests/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { RequestList } from '@/components/RequestList'
import { NewRequestButton } from '@/components/NewRequestButton'
import { MessageSquarePlus } from 'lucide-react'

export default async function RequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: requests } = await supabase
    .from('requests')
    .select('*, profiles(full_name)')
    .eq('status', 'open')
    .order('upvotes', { ascending: false })

  // Which ones current user has upvoted
  let userUpvotes = new Set<string>()
  if (user) {
    const { data: upvotes } = await supabase
      .from('request_upvotes')
      .select('request_id')
      .eq('user_id', user.id)
    userUpvotes = new Set((upvotes ?? []).map((u: any) => u.request_id))
  }

  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      <div className="bg-white border-b border-[#D7CCC8]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7 sm:py-8
                        flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#3E2723]">
              Score Requests
            </h1>
            <p className="text-[#8D6E63] mt-1 text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
              Can't find a score? Request it. Upvote what you need most.
            </p>
          </div>
          {user && <NewRequestButton />}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <RequestList
          requests={requests ?? []}
          userUpvotes={Array.from(userUpvotes)}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  )
}