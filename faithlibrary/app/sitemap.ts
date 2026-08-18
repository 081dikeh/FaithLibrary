// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/site'

// Next re-generates this on request (revalidated hourly), so newly
// uploaded public scores show up without a redeploy.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,         changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/browse`,   changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/requests`, changeFrequency: 'daily',   priority: 0.5 },
    { url: `${SITE_URL}/privacy`,  changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/terms`,    changeFrequency: 'yearly',  priority: 0.2 },
  ]

  const supabase = await createClient()
  const { data: files } = await supabase
    .from('files')
    .select('id, updated_at, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50000) // sitemap protocol's per-file cap

  const fileRoutes: MetadataRoute.Sitemap = (files ?? []).map(f => ({
    url: `${SITE_URL}/view/${f.id}`,
    lastModified: f.updated_at ?? f.created_at,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...fileRoutes]
}
