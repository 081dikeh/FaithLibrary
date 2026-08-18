import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { sanitizeOrFilterInput } from '@/lib/searchFilter'

export function useFiles(search?: string, category?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['files', search, category],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select('*, profiles(full_name, avatar_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (search) {
        const safe = sanitizeOrFilterInput(search)
        query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
      }
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })
}