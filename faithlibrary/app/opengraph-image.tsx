// app/opengraph-image.tsx
//
// Default social-preview image for any page that doesn't define its own
// (view/[id] etc. inherit this until/unless they get a dedicated one).
// Previously there was no OG image at all, so links shared on Slack,
// Twitter/X, iMessage, etc. rendered as a bare title + URL with no visual.
// Generated at request time via next/og — no static asset required.
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#3E2723',
          backgroundImage:
            'radial-gradient(circle at 25% 20%, rgba(93,64,55,0.55) 0%, rgba(62,39,35,0) 55%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            borderRadius: 20,
            background: '#5D4037',
            color: '#F7F4F2',
            fontSize: 48,
            fontWeight: 700,
            marginBottom: 32,
          }}
        >
          F
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#F7F4F2',
            letterSpacing: '-0.02em',
          }}
        >
          FaithLibrary
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#D7CCC8',
            marginTop: 16,
          }}
        >
          Sacred Music &amp; Choral Score Library
        </div>
      </div>
    ),
    { ...size }
  )
}