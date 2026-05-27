// app/(main)/privacy/page.tsx
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft } from 'lucide-react'

const LAST_UPDATED = 'April 2025'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen grain bg-[#F5F5F5]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#8D6E63]
                     hover:text-[#5D4037] transition-colors mb-8"
          style={{ fontFamily: 'var(--font-ui)' }}>
          <ArrowLeft size={14} /> Back to Library
        </Link>

        <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card p-8 sm:p-10">
          <p className="text-xs text-[#8D6E63] mb-2 uppercase tracking-widest font-semibold"
            style={{ fontFamily: 'var(--font-ui)' }}>
            Legal
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2723] mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#8D6E63] mb-10" style={{ fontFamily: 'var(--font-ui)' }}>
            Last updated: {LAST_UPDATED}
          </p>

          <div className="space-y-8" style={{ fontFamily: 'var(--font-ui)' }}>

            <Section title="1. What We Collect">
              When you create an account we collect your email address and, if you sign in
              with Google, your name and profile picture. When you upload content we store the
              file, its metadata (title, description, tags), and your user ID.
            </Section>

            <Section title="2. How We Use Your Data">
              We use your information to:
              <ul>
                <li>Provide and improve the FaithLibrary platform</li>
                <li>Associate uploaded scores with your account</li>
                <li>Send password reset or authentication emails when requested</li>
              </ul>
              We do not sell your data to third parties.
            </Section>

            <Section title="3. Data Storage">
              FaithLibrary is built on Supabase, which stores data in secure, managed
              PostgreSQL databases and object storage. Files you upload to public buckets
              are accessible via public URLs. Private files are accessible only to you.
            </Section>

            <Section title="4. Cookies & Authentication">
              We use secure HTTP-only cookies to manage your login session. No advertising
              cookies or tracking pixels are used on this platform.
            </Section>

            <Section title="5. Public Content">
              Scores you mark as "public" are visible to all visitors without requiring a
              login. Your display name may appear alongside your uploaded scores. You can
              change a score to "private" at any time from your dashboard.
            </Section>

            <Section title="6. Account Deletion">
              You may delete your account by contacting us. Upon deletion, your profile and
              personal data will be removed. Publicly uploaded scores may be retained in
              anonymised form unless you request their removal.
            </Section>

            <Section title="7. Third-Party Services">
              We use the following third-party services:
              <ul>
                <li><strong>Supabase</strong> — database, authentication, and file storage</li>
                <li><strong>Google OAuth</strong> — optional sign-in method</li>
                <li><strong>Vercel</strong> — hosting and deployment</li>
              </ul>
              Each service operates under its own privacy policy.
            </Section>

            <Section title="8. Changes to This Policy">
              We may update this policy from time to time. The date at the top of this page
              reflects the most recent update. Continued use of the platform constitutes
              acceptance of any changes.
            </Section>

            <Section title="9. Contact">
              For any privacy-related questions or data removal requests, please contact us
              through the platform.
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-[#3E2723] mb-2">{title}</h2>
      <div className="text-sm text-[#5D4037] leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  )
}