// app/(main)/terms/page.tsx
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft } from 'lucide-react'

const LAST_UPDATED = 'April 2025'

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-[#8D6E63] mb-10" style={{ fontFamily: 'var(--font-ui)' }}>
            Last updated: {LAST_UPDATED}
          </p>

          <div className="prose-faithlibrary space-y-8" style={{ fontFamily: 'var(--font-ui)' }}>

            <Section title="1. Acceptance of Terms">
              By accessing or using FaithLibrary, you agree to be bound by these Terms of
              Service. If you do not agree, please do not use the platform.
            </Section>

            <Section title="2. Use of the Platform">
              FaithLibrary is a platform for sharing choral music, hymns, and sacred scores.
              You may use FaithLibrary to upload, browse, and download publicly shared musical
              content. You agree not to use the platform for any unlawful purpose or in any
              way that could harm other users.
            </Section>

            <Section title="3. User Accounts">
              You are responsible for maintaining the confidentiality of your account
              credentials. You agree to notify us immediately of any unauthorised use of
              your account. We reserve the right to terminate accounts that violate these terms.
            </Section>

            <Section title="4. Content You Upload">
              By uploading content to FaithLibrary, you confirm that:
              <ul>
                <li>You own the content or have the right to share it.</li>
                <li>The content does not infringe any third-party copyright or intellectual property rights.</li>
                <li>You grant FaithLibrary a non-exclusive, royalty-free licence to display and
                    distribute your content within the platform.</li>
              </ul>
              We reserve the right to remove any content that violates these terms without notice.
            </Section>

            <Section title="5. Copyright & Intellectual Property">
              All content uploaded remains the property of the respective uploader.
              FaithLibrary does not claim ownership of user-uploaded content. If you believe
              content on the platform infringes your copyright, please contact us so we can
              investigate and take appropriate action.
            </Section>

            <Section title="6. Prohibited Content">
              You may not upload content that is:
              <ul>
                <li>Copyrighted without permission from the rights holder</li>
                <li>Hateful, abusive, or otherwise harmful</li>
                <li>Misleading or falsely attributed</li>
                <li>Unrelated to sacred, choral, or worship music</li>
              </ul>
            </Section>

            <Section title="7. Availability">
              FaithLibrary is provided on an "as is" basis. We do not guarantee uninterrupted
              access to the platform and reserve the right to modify or discontinue any part
              of the service at any time.
            </Section>

            <Section title="8. Changes to Terms">
              We may update these terms from time to time. Continued use of the platform after
              changes are posted constitutes your acceptance of the revised terms.
            </Section>

            <Section title="9. Contact">
              For questions about these terms, please reach out through the platform.
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