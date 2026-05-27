import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Get the Bearer token from the Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    // 2. Verify the token — create a client and set the session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 3. Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadataRaw = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const metadata = JSON.parse(metadataRaw || '{}')

    // 4. Upload file to Supabase Storage
    const ext = file.name.split('.').pop() || 'pdf'
    const storagePath = `${user.id}/${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: storageError } = await supabase.storage
      .from('faithlibrary-files')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: false,
      })

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 })
    }

    // 5. Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('faithlibrary-files')
      .getPublicUrl(storagePath)

    // 6. Save metadata to the files table
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        user_id: user.id,
        title: metadata.title || file.name,
        description: metadata.description || null,
        category: metadata.category || 'score',
        tags: metadata.tags || [],
        is_public: metadata.is_public ?? true,
        file_url: publicUrl,
        source: 'notation_app', // optional: track where it came from
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      file: fileRecord,
    }, { status: 201 })

  } catch (err) {
    console.error('External upload error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}