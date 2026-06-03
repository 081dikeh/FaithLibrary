// components/ViewTracker.tsx
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ViewTracker({ fileId }: { fileId: string }) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        await supabase.rpc('upsert_recently_viewed', { p_file_id: fileId })
      } catch { /* non-critical */ }
    }, 1000)
    return () => clearTimeout(timer)
  }, [fileId])
  return null
}