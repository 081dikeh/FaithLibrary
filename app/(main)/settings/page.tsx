// app/(main)/settings/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { SettingsForm } from '@/components/SettingsForm'
import { User, Lock, Trash2 } from 'lucide-react'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="min-h-screen grain bg-[#F5F5F5]">
            <Navbar />

            {/* Page header */}
            <div className="bg-white border-b border-[#D7CCC8]">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7 sm:py-8">
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2723]">
                        Account Settings
                    </h1>
                    <p className="text-[#8D6E63] mt-1 text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
                        Manage your profile and account preferences.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">

                {/* Profile section */}
                <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#EFE9E7] flex items-center gap-2">
                        <User size={15} className="text-[#8D6E63]" />
                        <h2 className="font-display text-base font-semibold text-[#3E2723]">
                            Profile
                        </h2>
                    </div>
                    <div className="p-6">
                        <SettingsForm
                            userId={user.id}
                            email={user.email ?? ''}
                            currentName={profile?.full_name ?? ''}
                        />
                    </div>
                </div>

                {/* Account info */}
                <div className="bg-white rounded-2xl border border-[#D7CCC8] shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#EFE9E7] flex items-center gap-2">
                        <Lock size={15} className="text-[#8D6E63]" />
                        <h2 className="font-display text-base font-semibold text-[#3E2723]">
                            Password
                        </h2>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-[#8D6E63] mb-4" style={{ fontFamily: 'var(--font-ui)' }}>
                            To change your password, we'll send a reset link to{' '}
                            <strong className="text-[#5D4037]">{user.email}</strong>.
                        </p>
                        <a
                            href="/forgot-password"
                            className="btn btn-secondary btn-sm"
                        >
                            Send reset link
                        </a>
                    </div>
                </div>

                {/* Danger zone */}
                <div className="bg-white rounded-2xl border border-red-200 shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2">
                        <Trash2 size={15} className="text-red-400" />
                        <h2 className="font-display text-base font-semibold text-red-600">
                            Danger Zone
                        </h2>
                    </div>
                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-[#3E2723]" style={{ fontFamily: 'var(--font-ui)' }}>
                                Delete account
                            </p>
                            <p className="text-xs text-[#8D6E63] mt-0.5" style={{ fontFamily: 'var(--font-ui)' }}>
                                This will permanently remove your account and all your uploads.
                            </p>
                        </div>
                        <button
                            className="btn btn-danger btn-sm flex-shrink-0 border border-red-200"
                            style={{ color: '#dc2626', padding: '0.5rem 1rem' }}
                        >
                            Delete account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}