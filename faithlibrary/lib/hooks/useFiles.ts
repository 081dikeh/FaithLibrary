// lib/hooks/useFiles.ts
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { searchFilesRanked, sortByRank } from '@/lib/searchRank'

export function useFiles(search?: string, category?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['files', search, category],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select('*, profiles(full_name, avatar_url)')
        .eq('is_public', true)

      let rankById: Map<string, number> | null = null

      if (search) {
        const ranked = await searchFilesRanked(supabase, search)
        if (!ranked || ranked.orderedIds.length === 0) return []
        rankById = ranked.rankById
        query = query.in('id', ranked.orderedIds)
      } else {
        query = query.order('created_at', { ascending: false })
      }
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) throw error
      return rankById && data ? sortByRank(data, rankById) : data
    }
  })
}