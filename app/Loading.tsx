// app/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#D7CCC8]
                        border-t-[#5D4037] animate-spin" />
        <p className="text-sm text-[#8D6E63]" style={{ fontFamily: 'var(--font-ui)' }}>
          Loading…
        </p>
      </div>
    </div>
  )
}