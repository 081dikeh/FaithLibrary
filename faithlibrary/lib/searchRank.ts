// lib/searchRank.ts
//
// Full-text search matching + relevance ranking, backed by the
// search_files_ranked() Postgres function (see
// supabase-migrations/004_add_fulltext_search.sql), which queries the
// generated `search_vector` tsvector column on `files`.
//
// This deliberately does ONLY matching + ranking, not the full query. Every
// call site already has its own combination of other filters (category,
// season, voicing, is_public) and its own choice of columns/joins — so the
// pattern is: call searchFilesRanked() to get which ids match and in what
// order, add `.in('id', ranked.orderedIds)` to your existing query, then
// call sortByRank() on the rows you get back to put them in relevance order
// (PostgREST has no way to order by an id list, so this step is what
// actually applies the ranking).
import type { SupabaseClient } from '@supabase/supabase-js'

export interface RankedSearch {
  /** Matching row ids, ordered by relevance (best match first). */
  orderedIds: string[]
  /** id -> relevance score, for re-sorting rows fetched separately. */
  rankById: Map<string, number>
}

/**
 * Runs a full-text search and returns matching ids in relevance order.
 * Returns null on a query error (caller decides how to degrade — e.g. fall
 * back to showing nothing rather than accidentally showing everything).
 * Returns an object with an empty `orderedIds` array (not null) when the
 * search legitimately matched zero rows.
 */
export async function searchFilesRanked(
  supabase: SupabaseClient,
  query: string
): Promise<RankedSearch | null> {
  const { data, error } = await supabase.rpc('search_files_ranked', { p_query: query })

  if (error) {
    console.error('search_files_ranked failed:', error.message)
    return null
  }

  const rows = (data ?? []) as { id: string; rank: number }[]
  return {
    orderedIds: rows.map(r => r.id),
    rankById: new Map(rows.map(r => [r.id, r.rank])),
  }
}

/**
 * Re-sorts already-fetched rows into relevance order using the rankById
 * map from searchFilesRanked(). Does not mutate the input array.
 */
export function sortByRank<T extends { id: string }>(rows: T[], rankById: Map<string, number>): T[] {
  return [...rows].sort((a, b) => (rankById.get(b.id) ?? -Infinity) - (rankById.get(a.id) ?? -Infinity))
}