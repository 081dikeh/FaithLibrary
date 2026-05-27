// app/print/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrintViewer } from '@/components/PrintViewer'

interface PrintPageProps {
  params: Promise<{ id: string }>
}

export default async function PrintPage({ params }: PrintPageProps) {
  const { id }   = await params
  const supabase = await createClient()

  const { data: file, error } = await supabase
    .from('files')
    .select('id, title, composer, arranger, voice_parts, file_url')
    .eq('id', id)
    .single()

  if (error || !file) notFound()

  return <PrintViewer file={file} />
}