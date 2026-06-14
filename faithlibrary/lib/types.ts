// lib/types.ts
// lib/types.ts — add thumbnail_url to FileRecord if not already present
// Find your FileRecord interface and add this field:

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
  thumbnail_url?: string | null   // ← ADD THIS if missing
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