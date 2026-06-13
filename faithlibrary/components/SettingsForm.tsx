// components/SettingsForm.tsx — UI rewrite, all logic unchanged
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react'

interface SettingsFormProps {
  userId:      string
  email:       string
  currentName: string
}

export function SettingsForm({ userId, email, currentName }: SettingsFormProps) {
  const supabase = createClient()
  const [name,    setName]    = useState(currentName)
  const [status,  setStatus]  = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    setStatus('saving')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim() })
      .eq('id', userId)
    if (error) {
      setMessage(error.message); setStatus('error')
    } else {
      setMessage('Display name updated successfully.'); setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#5D4037'
    e.target.style.boxShadow = '0 0 0 3px rgba(93,64,55,0.1)'
    e.target.style.background = '#fff'
  }
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#E0D8D4'
    e.target.style.boxShadow = 'none'
    e.target.style.background = '#FAFAF9'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Email — read only */}
      <div>
        <label style={{
          display: 'block', fontSize: '0.72rem', fontWeight: 700,
          letterSpacing: '0.07em', textTransform: 'uppercase',
          color: '#8D6E63', marginBottom: 6, fontFamily: 'var(--font-ui)',
        }}>Email</label>
        <input
          type="email" value={email} disabled
          style={{
            width: '100%', fontFamily: 'var(--font-ui)', fontSize: '0.875rem',
            color: '#9E8070', background: '#F5F1EF',
            border: '1.5px solid #E8E4E1', borderRadius: 10,
            padding: '10px 13px', outline: 'none',
            cursor: 'not-allowed',
          }}
        />
        <p style={{ marginTop: 5, fontSize: '0.73rem', color: '#B09080', fontFamily: 'var(--font-ui)' }}>
          Email cannot be changed directly. Contact support if needed.
        </p>
      </div>

      {/* Display name */}
      <div>
        <label style={{
          display: 'block', fontSize: '0.72rem', fontWeight: 700,
          letterSpacing: '0.07em', textTransform: 'uppercase',
          color: '#5D4037', marginBottom: 6, fontFamily: 'var(--font-ui)',
        }}>Display Name</label>
        <input
          type="text" value={name}
          onChange={e => setName(e.target.value)}
          placeholder="How you appear to others"
          style={{
            width: '100%', fontFamily: 'var(--font-ui)', fontSize: '0.875rem',
            color: '#2C1810', background: '#FAFAF9',
            border: '1.5px solid #E0D8D4', borderRadius: 10,
            padding: '10px 13px', outline: 'none', lineHeight: 1.5,
            transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
          }}
          onFocus={inputFocus}
          onBlur={inputBlur}
        />
        <p style={{ marginTop: 5, fontSize: '0.73rem', color: '#9E8070', fontFamily: 'var(--font-ui)' }}>
          This is the name shown on your uploads and profile page.
        </p>
      </div>

      {/* Status messages */}
      {status === 'success' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 16px', borderRadius: 10,
          background: '#F0FDF4', border: '1.5px solid #86EFAC',
          color: '#166534', fontSize: '0.875rem', fontFamily: 'var(--font-ui)',
        }}>
          <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
          {message}
        </div>
      )}
      {status === 'error' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 16px', borderRadius: 10,
          background: '#FEF2F2', border: '1.5px solid #FCA5A5',
          color: '#991B1B', fontSize: '0.875rem', fontFamily: 'var(--font-ui)',
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {message}
        </div>
      )}

      {/* Save button */}
      <div>
        <button
          onClick={handleSave}
          disabled={status === 'saving' || !name.trim() || name === currentName}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 22px', borderRadius: 10, border: 'none',
            background: (status === 'saving' || !name.trim() || name === currentName) ? '#E0D8D4' : '#3E2723',
            color: (status === 'saving' || !name.trim() || name === currentName) ? '#9E8070' : '#F7F4F2',
            cursor: (status === 'saving' || !name.trim() || name === currentName) ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem', fontWeight: 700,
            fontFamily: 'var(--font-ui)',
            transition: 'all 0.2s',
            boxShadow: (status === 'saving' || !name.trim() || name === currentName) ? 'none' : '0 2px 8px rgba(62,39,35,0.22)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement
            if (!el.disabled) el.style.background = '#2C1810'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement
            if (!el.disabled) el.style.background = '#3E2723'
          }}
        >
          {status === 'saving'
            ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
            : <><Save size={15} /> Save changes</>
          }
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}