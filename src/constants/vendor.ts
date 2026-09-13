export type VendorType = 'bafkitchen' | 'bazaf' | 'both'

export const VENDOR_TYPE_OPTIONS: { value: VendorType; label: string }[] = [
  { value: 'bafkitchen', label: 'Baf Kitchen' },
  { value: 'bazaf', label: 'Bazaf' },
  { value: 'both', label: 'Keduanya' }
]

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  bafkitchen: 'Baf Kitchen',
  bazaf: 'Bazaf',
  both: 'Keduanya'
}
