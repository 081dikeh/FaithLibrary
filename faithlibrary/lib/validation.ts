// lib/validation.ts
// Central place for file-type rules. PDF is currently the only format
// FaithLibrary accepts for score uploads — keep this in sync with:
//   - components/UploadForm.tsx
//   - components/BulkUploadForm.tsx
//   - app/api/external-upload/route.ts (server-side, since client checks
//     can always be bypassed by calling the API directly)

export const ACCEPTED_FILE_EXTENSION = '.pdf'
export const ACCEPTED_MIME_TYPE = 'application/pdf'

/**
 * Returns true only for actual PDF files. Checks both the browser-reported
 * MIME type and the filename extension (case-insensitive) — MIME type
 * alone isn't reliable for locally-dropped files, and extension alone can
 * be spoofed, so both are checked and either must be a valid PDF signal
 * while neither may contradict it.
 */
export function isPdfFile(file: { name: string; type?: string }): boolean {
  const hasPdfExtension = file.name.toLowerCase().endsWith(ACCEPTED_FILE_EXTENSION)
  const hasPdfMimeType = !file.type || file.type === ACCEPTED_MIME_TYPE
  return hasPdfExtension && hasPdfMimeType
}

export const FILE_TYPE_ERROR_MESSAGE = 'Only PDF files are accepted right now.'
