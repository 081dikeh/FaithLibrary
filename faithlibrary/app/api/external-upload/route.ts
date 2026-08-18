import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { isPdfFile, FILE_TYPE_ERROR_MESSAGE } from '@/lib/validation'
import { isValidLicenseStatus } from '@/lib/license'
import { notifyMatchingRequesters } from '@/lib/matchRequests'

export async function POST(request: NextRequest) {
  try {
    // 1. Get the Bearer token from the Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    // 2. Verify the token identifies a real user.
    //    NOTE: this uses the cookie-based server client purely to call
    //    auth.getUser(token), which is a one-off verification request and
    //    does NOT attach the token to that client's session. External
    //    callers (e.g. a notation app) have no browser cookies, so any
    //    .from()/.storage call made on `authClient` below would run as
    //    the anon role and get rejected by RLS. We build a second,
    //    request-scoped client further down that carries the bearer
    //    token on every request instead, and use THAT for all writes.
    const authClient = await createServerClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 2b. A client whose every request (storage + postgrest) carries the
    //     caller's JWT, so RLS policies see the real authenticated user
    //     instead of anon.
    const supabase = createSupabaseJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    // 3. Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadataRaw = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!isPdfFile(file)) {
      return NextResponse.json({ error: FILE_TYPE_ERROR_MESSAGE }, { status: 415 })
    }

    const metadata = JSON.parse(metadataRaw || '{}')

    // 4. Upload file to Supabase Storage
    const ext = 'pdf'
    const storagePath = `${user.id}/${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: storageError } = await supabase.storage
      .from('faithlibrary-files')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
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
        license_status: isValidLicenseStatus(metadata.license_status) ? metadata.license_status : 'unknown',
        file_url: publicUrl,
        source: 'notation_app', // optional: track where it came from
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    if (fileRecord?.is_public) {
      // Best-effort — a notification failure shouldn't fail the upload response.
      notifyMatchingRequesters(supabase, {
        fileId: fileRecord.id,
        fileTitle: fileRecord.title,
        tags: fileRecord.tags ?? [],
        excludeUserId: user.id,
      }).catch(() => {})
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