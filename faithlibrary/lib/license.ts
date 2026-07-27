// lib/license.ts
// Copyright/license status for uploaded scores. Sacred-music sharing sites
// run into real copyright trouble (many "free" hymnal PDFs floating around
// online are not actually public domain), so we ask uploaders to declare
// status at upload time rather than leaving it unstated.

export const LICENSE_STATUSES = [
  'public_domain',
  'permission',
  'original',
  'unknown',
] as const

export type LicenseStatus = typeof LICENSE_STATUSES[number]

export const LICENSE_OPTIONS: { value: LicenseStatus; label: string; hint: string }[] = [
  {
    value: 'public_domain',
    label: 'Public Domain',
    hint: 'No copyright restrictions (e.g. composer died 70+ years ago, or explicitly released)',
  },
  {
    value: 'permission',
    label: 'Copyrighted — Used with Permission',
    hint: "You have the rights holder's permission to share this arrangement",
  },
  {
    value: 'original',
    label: 'Original Composition',
    hint: 'You wrote or arranged this yourself',
  },
  {
    value: 'unknown',
    label: "Unknown / Not Sure",
    hint: "You're not certain of the copyright status",
  },
]

const LICENSE_LABELS: Record<LicenseStatus, string> =
  Object.fromEntries(LICENSE_OPTIONS.map(o => [o.value, o.label])) as Record<LicenseStatus, string>

export function getLicenseLabel(status?: string | null): string {
  if (status && (LICENSE_STATUSES as readonly string[]).includes(status)) {
    return LICENSE_LABELS[status as LicenseStatus]
  }
  return LICENSE_LABELS.unknown
}

export function isValidLicenseStatus(value: unknown): value is LicenseStatus {
  return typeof value === 'string' && (LICENSE_STATUSES as readonly string[]).includes(value)
}
