// app/(main)/edit/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { EditFileForm } from '@/components/EditFileForm'

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: file, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)   // only owner can edit
    .single()

  if (error || !file) notFound()

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[#3E2723]">Edit Score</h1>
          <p className="text-[#8D6E63] mt-1 text-sm">Update your score's details below.</p>
        </div>
        <EditFileForm file={file} />
      </div>
    </div>
  )
}