// components/ViewTracker.tsx
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ViewTracker({ fileId }: { fileId: string }) {
  const supabase = createClient()

  useEffect(() => {
    const track = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.rpc('upsert_recently_viewed', { p_file_id: fileId })
    }
    track()
  }, [fileId])

  return null
}