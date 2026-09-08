// app/icon.tsx
//
// No favicon existed anywhere in the repo (no /public folder, no
// app/favicon.ico), so browser tabs, bookmarks, and search results all show
// a generic blank icon. Next.js serves whatever this file exports at
// /icon automatically — no static asset needed. Kept deliberately simple
// (solid brand color + a monogram) so it renders reliably without needing
// to fetch or embed a custom font file.
import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#5D4037',
          borderRadius: 6,
          color: '#F7F4F2',
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        F
      </div>
    ),
    { ...size }
  )
}