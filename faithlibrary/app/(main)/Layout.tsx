// app/(main)/layout.tsx
// Navbar is included per-page so each page controls its own sticky header.
// This layout just ensures the route group resolves correctly.
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F7F4F2]">{children}</div>
}