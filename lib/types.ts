// lib/types.ts
export type FileRecord = {
  id: string
  user_id: string
  title: string
  description: string | null
  file_url: string
  thumbnail_url: string | null
  category: 'hymn' | 'score' | 'document' | 'composition' | 'other'
  tags: string[]
  is_public: boolean
  download_count: number
  created_at: string
  source?: string
  profiles?: {
    full_name: string
    avatar_url: string | null
  }
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