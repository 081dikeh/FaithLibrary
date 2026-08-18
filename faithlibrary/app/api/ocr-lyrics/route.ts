// app/api/ocr-lyrics/route.ts
//
// Best-effort background OCR for the "search by remembered lyrics" feature.
// Called fire-and-forget right after a successful upload (see UploadForm.tsx).
// Never blocks the upload UX — if this fails or is unconfigured, the score
// is still uploaded fine; it just won't be lyric-searchable until someone
// adds lyrics manually via the edit form.
//
// Requires GOOGLE_CLOUD_VISION_API_KEY to be set. Without it, this route
// is a safe no-op (returns 200 with skipped: true) rather than an error,
// since OCR is a nice-to-have, not a blocking requirement.
//
// Uses Cloud Vision's synchronous `files:annotate` REST endpoint with
// DOCUMENT_TEXT_DETECTION, which handles typed text well and has some
// handwriting support — but many scores in this library are handwritten,
// so results will be inconsistent for those. That's expected: the manual
// "Lyrics" field on upload/edit always takes priority over OCR output,
// specifically so handwritten scores aren't left worse off.
//
// Known limitation: the synchronous API only reads the first 5 pages of a
// PDF. Fine for typical 1-4 page choir scores; longer documents will only
// get partial OCR. A future batch/async pipeline (writing to a GCS bucket)
// would be the fix if that becomes a real problem.

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/files:annotate'
const MAX_LYRICS_CHARS = 4000

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
  if (!apiKey) {
    return NextResponse.json({ skipped: true, reason: 'GOOGLE_CLOUD_VISION_API_KEY not configured' })
  }

  let fileId: string
  try {
    const body = await request.json()
    fileId = body.fileId
    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    // Uses the caller's session (cookies) so the later `.update()` below
    // satisfies the existing RLS policy — this route currently only works
    // for OCR-ing a file right after its own uploader creates it, not for
    // reprocessing older files uploaded by someone else. A proper backfill
    // over all existing scores would need a service-role key, which this
    // project doesn't currently have configured.
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Look the file up ourselves rather than trusting a client-supplied
    // fileUrl: without this, any caller — authenticated or not — could
    // point this route at an arbitrary URL and get it fetched and run
    // through (billed) Vision OCR, regardless of whether it's even a
    // FaithLibrary file. Also enforces that only the file's own uploader
    // can trigger OCR for it, matching how this is actually invoked
    // (fire-and-forget, right after that same user's own upload).
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('file_url, user_id, lyrics_source')
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    if (file.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to OCR this file' }, { status: 403 })
    }

    // Don't clobber lyrics someone already typed in manually.
    if (file.lyrics_source === 'manual') {
      return NextResponse.json({ skipped: true, reason: 'manual lyrics already present' })
    }

    // Fetch the PDF and inline it as base64 for the sync Vision endpoint.
    const pdfRes = await fetch(file.file_url)
    if (!pdfRes.ok) {
      return NextResponse.json({ error: `Could not fetch PDF: ${pdfRes.status}` }, { status: 502 })
    }
    const pdfBuffer = await pdfRes.arrayBuffer()
    // Sync files:annotate is meant for small inputs — bail out rather than
    // send something Vision will likely reject anyway.
    if (pdfBuffer.byteLength > 15 * 1024 * 1024) {
      return NextResponse.json({ skipped: true, reason: 'PDF too large for sync OCR (>15MB)' })
    }
    const base64 = Buffer.from(pdfBuffer).toString('base64')

    const visionRes = await fetch(`${VISION_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          inputConfig: { content: base64, mimeType: 'application/pdf' },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          // Sync endpoint caps at 5 pages per request regardless.
          pages: [1, 2, 3, 4, 5],
        }],
      }),
    })

    if (!visionRes.ok) {
      const errText = await visionRes.text().catch(() => '')
      return NextResponse.json({ error: `Vision API error: ${visionRes.status} ${errText}` }, { status: 502 })
    }

    const visionData = await visionRes.json()
    const pageResponses = visionData?.responses?.[0]?.responses ?? []
    const text = pageResponses
      .map((p: { fullTextAnnotation?: { text?: string } }) => p.fullTextAnnotation?.text ?? '')
      .filter(Boolean)
      .join('\n\n')
      .trim()

    if (!text) {
      return NextResponse.json({ ok: true, extracted: false, reason: 'No text detected' })
    }

    const truncated = text.length > MAX_LYRICS_CHARS ? text.slice(0, MAX_LYRICS_CHARS) : text

    const { error: updateError } = await supabase
      .from('files')
      .update({ lyrics: truncated, lyrics_source: 'ocr' })
      .eq('id', fileId)

    if (updateError) {
      return NextResponse.json({ error: `Could not save OCR text: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, extracted: true, chars: truncated.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown OCR error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}