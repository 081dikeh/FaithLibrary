// components/ShareButtons.tsx
'use client'
import { Share2, Download } from 'lucide-react'

export function ShareButton({ title }: { title: string }) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="btn-icon text-[#8D6E63]"
      style={{ padding: '0.4rem', borderRadius: '10px' }}
      aria-label="Share"
    >
      <Share2 size={16} />
    </button>
  )
}

export function ShareButtonFull({ title }: { title: string }) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="btn btn-secondary w-full"
      style={{ justifyContent: 'center', padding: '0.7rem' }}
    >
      <Share2 size={15} /> Share Score
    </button>
  )
}