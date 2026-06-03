// components/ViewTracker.tsx
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ViewTracker({ fileId }: { fileId: string }) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient()
        // getSession() does NOT acquire a navigator lock — safe to call from many components
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        await supabase.rpc('upsert_recently_viewed', { p_file_id: fileId })
      } catch {
        // Non-critical — silently ignore
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [fileId])

  return null
}