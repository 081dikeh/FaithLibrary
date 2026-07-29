// lib/matchRequests.ts
import type { SupabaseClient } from '@supabase/supabase-js'

interface NotifyMatchingRequestersParams {
  fileId: string
  fileTitle: string
  tags: string[]
  /** Usually the uploader's own id — skip notifying someone about their own upload. */
  excludeUserId?: string
}

/**
 * When a new score is uploaded, checks open score requests for a tag
 * overlap and notifies each matching requester. This doesn't auto-mark the
 * request fulfilled — a shared tag isn't proof it's the right piece — it
 * just surfaces the possibility so the requester (or an admin) can confirm
 * and mark it fulfilled via the existing admin "Fulfill" action.
 */
export async function notifyMatchingRequesters(
  supabase: SupabaseClient,
  { fileId, fileTitle, tags, excludeUserId }: NotifyMatchingRequestersParams
): Promise<void> {
  if (tags.length === 0) return

  const { data: matches } = await supabase
    .from('requests')
    .select('id, user_id, title')
    .eq('status', 'open')
    .overlaps('tags', tags)

  if (!matches || matches.length === 0) return

  const notifications = matches
    .filter((m: { user_id: string | null }) => m.user_id && m.user_id !== excludeUserId)
    .map((m: { user_id: string; title: string }) => ({
      user_id: m.user_id,
      type:    'request_possibly_fulfilled',
      title:   'A score matching your request was just uploaded',
      body:    `"${fileTitle}" shares tags with your request "${m.title}" — take a look.`,
      link:    `/view/${fileId}`,
    }))

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications)
  }
}
