// lib/categories.ts

export const MASS_PARTS = [
  'Entrance',
  'Kyrie',
  'Gloria',
  'Responsorial Psalm',
  'Gospel Acclamation',
  'Credo',
  'Offertory',
  'Sanctus',
  'Consecration',
  'Lamb of God',
  'Communion',
  'Recessional',
] as const

export const LITURGICAL_TAGS = [
  'Gospel Acclamation (Alleluia)',
  'Sequence',
  'Recessional Hymn',
  'Meditation / Reflection',
  'Processional (general)',
] as const

export const LITURGICAL_SEASONS = [
  'Advent',
  'Christmas',
  'Lent',
  'Holy Week',
  'Easter',
  'Pentecost',
  'Ordinary Time',
] as const

export const OCCASIONS = [
  'Wedding',
  'Funeral / Requiem',
  'Baptism',
  'Confirmation',
  'Ordination',
] as const

export const DEVOTIONAL = [
  'Marian Hymns',
  'Praise & Worship',
  'Thanksgiving',
  'Adoration / Benediction',
] as const

export const GENERAL_TAGS = ['General'] as const

// Flat list for dropdowns/search
export const ALL_TAGS: string[] = [
  ...MASS_PARTS,
  ...LITURGICAL_TAGS,
  ...LITURGICAL_SEASONS,
  ...OCCASIONS,
  ...DEVOTIONAL,
  ...GENERAL_TAGS,
]

// Grouped for the dropdown UI
export const TAG_GROUPS = [
  { label: 'Mass Parts',          tags: [...MASS_PARTS] },
  { label: 'Liturgical',          tags: [...LITURGICAL_TAGS] },
  { label: 'Liturgical Seasons',  tags: [...LITURGICAL_SEASONS] },
  { label: 'Occasions',           tags: [...OCCASIONS] },
  { label: 'Devotional',          tags: [...DEVOTIONAL] },
  { label: 'General',             tags: [...GENERAL_TAGS] },
] as const