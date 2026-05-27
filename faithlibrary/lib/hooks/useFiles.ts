import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

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
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
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