// app/not-found.tsx
import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="relative w-16 h-16 mb-6 opacity-30">
        <Image src="/FaithLibrary_logo.png" alt="FaithLibrary" fill className="object-contain" />
      </div>

      {/* Big 404 */}
      <p className="font-display text-8xl font-bold text-[#D7CCC8] leading-none mb-2">
        404
      </p>
      <h1 className="font-display text-2xl font-semibold text-[#3E2723] mb-3">
        Score not found
      </h1>
      <p className="text-[#8D6E63] text-sm max-w-xs leading-relaxed mb-8">
        This page doesn't exist or may have been removed. Let's get you back to the library.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-[#5D4037] hover:bg-[#3E2723]
                     text-[#F5F5F5] text-sm font-semibold transition-colors"
        >
          Back to Library
        </Link>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl border border-[#D7CCC8]
                     hover:border-[#8D6E63] text-[#8D6E63] hover:text-[#5D4037]
                     text-sm font-medium transition-colors bg-white"
        >
          My Dashboard
        </Link>
      </div>

      {/* Staff lines decoration */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col gap-3 opacity-5 pointer-events-none px-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-px bg-[#5D4037] w-full" />
        ))}
      </div>
    </div>
  )
}