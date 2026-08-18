// lib/types.ts
import type { LicenseStatus } from '@/lib/license'

export interface FileRecord {
  id:             string
  user_id:        string
  title:          string
  description?:   string | null
  composer?:      string | null
  arranger?:      string | null
  voice_parts?:   string | null
  category?:      string | null
  tags?:          string[]
  is_public:      boolean
  file_url:       string
  thumbnail_url?: string | null
  lyrics?:        string | null
  lyrics_source?: 'manual' | 'ocr' | null
  license_status?: LicenseStatus | null
  download_count?: number | null
  created_at:     string
  updated_at?:    string
  profiles?: {
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Bookmark = {
  id: string
  user_id: string
  file_id: string
  created_at: string
  files?: FileRecord
}