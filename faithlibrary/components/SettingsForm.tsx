// components/SettingsForm.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface SettingsFormProps {
  userId:      string
  email:       string
  currentName: string
}

export function SettingsForm({ userId, email, currentName }: SettingsFormProps) {
  const supabase  = createClient()
  const [name,    setName]    = useState(currentName)
  const [saving,  setSaving]  = useState(false)
  const [status,  setStatus]  = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setStatus('idle')

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim() })
      .eq('id', userId)

    // Also update auth metadata
    await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    })

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Email (read-only) */}
      <div>
        <label className="label">Email address</label>
        <input
          type="email"
          value={email}
          disabled
          className="input bg-[#F5F5F5] text-[#8D6E63] cursor-not-allowed"
        />
        <p className="text-xs text-[#8D6E63] mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
          Email cannot be changed.
        </p>
      </div>

      {/* Display name */}
      <div>
        <label className="label">Display name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          className="input"
        />
        <p className="text-xs text-[#8D6E63] mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
          This appears on your profile and next to your uploaded scores.
        </p>
      </div>

      {/* Alerts */}
      {status === 'success' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                        bg-green-50 border border-green-200 text-green-700 text-sm"
          style={{ fontFamily: 'var(--font-ui)' }}>
          <CheckCircle2 size={15} className="flex-shrink-0" /> Profile updated successfully.
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                        bg-red-50 border border-red-200 text-red-700 text-sm"
          style={{ fontFamily: 'var(--font-ui)' }}>
          <AlertCircle size={15} className="flex-shrink-0" /> {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !name.trim() || name.trim() === currentName}
        className="btn btn-primary"
        style={{ padding: '0.6rem 1.5rem' }}
      >
        {saving
          ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
          : 'Save changes'}
      </button>
    </form>
  )
}