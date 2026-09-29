// lib/__tests__/searchRank.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchFilesRanked, sortByRank } from '@/lib/searchRank'

function buildMockSupabase(rpcResult: { data: unknown; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult)
  return { rpc }
}

type MockSupabase = ReturnType<typeof buildMockSupabase>
function asSupabaseClient(mock: MockSupabase) {
  return mock as unknown as import('@supabase/supabase-js').SupabaseClient
}

describe('searchFilesRanked', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls the search_files_ranked RPC with the query', async () => {
    const supabase = buildMockSupabase({ data: [], error: null })
    await searchFilesRanked(asSupabaseClient(supabase), 'ave maria')
    expect(supabase.rpc).toHaveBeenCalledWith('search_files_ranked', { p_query: 'ave maria' })
  })

  it('returns ordered ids and a rank map on a match', async () => {
    const supabase = buildMockSupabase({
      data: [
        { id: 'f1', rank: 0.9 },
        { id: 'f2', rank: 0.4 },
      ],
      error: null,
    })
    const result = await searchFilesRanked(asSupabaseClient(supabase), 'ave maria')
    expect(result).not.toBeNull()
    expect(result!.orderedIds).toEqual(['f1', 'f2'])
    expect(result!.rankById.get('f1')).toBe(0.9)
    expect(result!.rankById.get('f2')).toBe(0.4)
  })

  it('returns an empty (non-null) result when there are zero matches', async () => {
    const supabase = buildMockSupabase({ data: [], error: null })
    const result = await searchFilesRanked(asSupabaseClient(supabase), 'no such score')
    expect(result).toEqual({ orderedIds: [], rankById: new Map() })
  })

  it('returns null and logs when the RPC call errors', async () => {
    const supabase = buildMockSupabase({ data: null, error: { message: 'connection reset' } })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await searchFilesRanked(asSupabaseClient(supabase), 'ave maria')

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('sortByRank', () => {
  it('sorts rows highest rank first', () => {
    const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const rankById = new Map([['a', 0.2], ['b', 0.9], ['c', 0.5]])
    expect(sortByRank(rows, rankById).map(r => r.id)).toEqual(['b', 'c', 'a'])
  })

  it('does not mutate the input array', () => {
    const rows = [{ id: 'a' }, { id: 'b' }]
    const rankById = new Map([['a', 0.1], ['b', 0.9]])
    const original = [...rows]
    sortByRank(rows, rankById)
    expect(rows).toEqual(original)
  })

  it('sorts rows missing from the rank map last', () => {
    const rows = [{ id: 'unranked' }, { id: 'a' }]
    const rankById = new Map([['a', 0.5]])
    expect(sortByRank(rows, rankById).map(r => r.id)).toEqual(['a', 'unranked'])
  })
})