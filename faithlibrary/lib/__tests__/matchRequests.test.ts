import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyMatchingRequesters } from '@/lib/matchRequests'

function buildMockSupabase(requestMatches: { id: string; user_id: string | null; title: string }[]) {
  const insert = vi.fn().mockResolvedValue({ data: null, error: null })
  const overlaps = vi.fn().mockResolvedValue({ data: requestMatches, error: null })
  const eq = vi.fn(() => ({ overlaps }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn((table: string) =>
    table === 'requests' ? { select } : { insert }
  )
  return { from, insert, overlaps, eq, select }
}

type MockSupabase = ReturnType<typeof buildMockSupabase>
function asSupabaseClient(mock: MockSupabase) {
  return mock as unknown as import('@supabase/supabase-js').SupabaseClient
}

describe('notifyMatchingRequesters', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does nothing when the uploaded file has no tags', async () => {
    const supabase = buildMockSupabase([])
    await notifyMatchingRequesters(asSupabaseClient(supabase), { fileId: 'f1', fileTitle: 'Ave Maria', tags: [] })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('does nothing when no open requests match', async () => {
    const supabase = buildMockSupabase([])
    await notifyMatchingRequesters(asSupabaseClient(supabase), { fileId: 'f1', fileTitle: 'Ave Maria', tags: ['Communion'] })
    expect(supabase.insert).not.toHaveBeenCalled()
  })

  it('inserts a notification for each matching requester', async () => {
    const supabase = buildMockSupabase([
      { id: 'r1', user_id: 'user-a', title: 'Need a Communion hymn' },
      { id: 'r2', user_id: 'user-b', title: 'Looking for Marian hymns' },
    ])
    await notifyMatchingRequesters(asSupabaseClient(supabase), { fileId: 'f1', fileTitle: 'Ave Maria', tags: ['Communion'] })

    expect(supabase.insert).toHaveBeenCalledTimes(1)
    const notifications = supabase.insert.mock.calls[0][0]
    expect(notifications).toHaveLength(2)
    expect(notifications[0]).toMatchObject({ user_id: 'user-a', link: '/view/f1', type: 'request_possibly_fulfilled' })
  })

  it('excludes the uploader from their own request notifications', async () => {
    const supabase = buildMockSupabase([
      { id: 'r1', user_id: 'uploader-id', title: 'My own old request' },
      { id: 'r2', user_id: 'user-b', title: 'Someone else\u2019s request' },
    ])
    await notifyMatchingRequesters(asSupabaseClient(supabase), {
      fileId: 'f1', fileTitle: 'Ave Maria', tags: ['Communion'], excludeUserId: 'uploader-id',
    })

    const notifications = supabase.insert.mock.calls[0][0]
    expect(notifications).toHaveLength(1)
    expect(notifications[0].user_id).toBe('user-b')
  })

  it('skips requests with no associated user', async () => {
    const supabase = buildMockSupabase([
      { id: 'r1', user_id: null, title: 'Orphaned request' },
    ])
    await notifyMatchingRequesters(asSupabaseClient(supabase), { fileId: 'f1', fileTitle: 'Ave Maria', tags: ['Communion'] })
    expect(supabase.insert).not.toHaveBeenCalled()
  })
})
