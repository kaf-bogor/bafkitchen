import { parseJson, uuid } from '@/lib/server/db'

export interface ActivityProductRow {
  id: string
  name: string | null
  sku: string | null
  unit: string | null
  is_active: number | null
  price_base: number | null
  price: number | null
  stock: number | null
  vendor: string | null
  category_ids: string | null
  description: string | null
  image_url: string | null
  availability: string | null
  preorder_start: string | null
  preorder_end: string | null
  channels: string | null
  availability_type: string | null
  weekly_days: string | null
  specific_dates: string | null
  preorder_lead_days: number | null
  preorder_cutoff_time: string | null
  preorder_min_qty: number | null
  preorder_max_qty: number | null
  preorder_capacity: number | null
  fulfillment_type: string | null
  approval_status: string | null
}

export interface ProductChange {
  field: string
  label: string
  from: string
  to: string
}

export interface ProductActivity {
  id: string
  userId: string
  userEmail: string
  userName: string
  action: string
  changes: ProductChange[]
  timestamp: string
  createdAt: string
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nama',
  sku: 'SKU',
  unit: 'Satuan',
  isActive: 'Status aktif',
  priceBase: 'HPP',
  price: 'Harga jual',
  stock: 'Stok',
  vendor: 'Vendor',
  categoryIds: 'Kategori',
  description: 'Deskripsi',
  imageUrl: 'Gambar',
  availability: 'Ketersediaan',
  preorderStart: 'Preorder mulai',
  preorderEnd: 'Preorder selesai',
  channels: 'Kanal',
  availabilityType: 'Tipe ketersediaan',
  weeklyDays: 'Hari tersedia',
  specificDates: 'Tanggal khusus',
  preorderLeadDays: 'Lead days',
  preorderCutoffTime: 'Batas waktu preorder',
  preorderMinQty: 'Min qty',
  preorderMaxQty: 'Max qty',
  preorderCapacity: 'Kapasitas',
  fulfillmentType: 'Pemenuhan',
  approvalStatus: 'Approval'
}

const FIELD_ORDER = [
  'name',
  'sku',
  'unit',
  'isActive',
  'priceBase',
  'price',
  'stock',
  'vendor',
  'categoryIds',
  'description',
  'imageUrl',
  'availability',
  'preorderStart',
  'preorderEnd',
  'channels',
  'availabilityType',
  'weeklyDays',
  'specificDates',
  'preorderLeadDays',
  'preorderCutoffTime',
  'preorderMinQty',
  'preorderMaxQty',
  'preorderCapacity',
  'fulfillmentType',
  'approvalStatus'
]

const APPROVAL_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak'
}

export type ProductSnapshot = Record<string, unknown>

export const snapshotProduct = (row: ActivityProductRow): ProductSnapshot => {
  const vendor = parseJson<{ id?: string; name?: string } | null>(
    row.vendor,
    null
  )
  return {
    name: row.name ?? '',
    sku: row.sku ?? '',
    unit: row.unit || 'pcs',
    isActive: (row.is_active ?? 1) === 1,
    priceBase: row.price_base ?? 0,
    price: row.price ?? 0,
    stock: row.stock ?? 0,
    vendor: vendor?.id || vendor?.name ? vendor : null,
    categoryIds: parseJson<string[]>(row.category_ids, []),
    description: row.description ?? '',
    imageUrl: row.image_url ?? '',
    availability: row.availability || 'ready',
    preorderStart: row.preorder_start ?? null,
    preorderEnd: row.preorder_end ?? null,
    channels: (row.channels || 'pos')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean),
    availabilityType: row.availability_type || 'always',
    weeklyDays: parseJson<number[]>(row.weekly_days, []),
    specificDates: parseJson<string[]>(row.specific_dates, []),
    preorderLeadDays: row.preorder_lead_days ?? null,
    preorderCutoffTime: row.preorder_cutoff_time ?? null,
    preorderMinQty: row.preorder_min_qty ?? null,
    preorderMaxQty: row.preorder_max_qty ?? null,
    preorderCapacity: row.preorder_capacity ?? null,
    fulfillmentType: row.fulfillment_type || 'takeaway',
    approvalStatus: row.approval_status || 'approved'
  }
}

const normalizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return [...value].map(String).sort()
  if (value && typeof value === 'object') return JSON.stringify(value)
  return value
}

const isEqual = (a: unknown, b: unknown) =>
  JSON.stringify(normalizeValue(a)) === JSON.stringify(normalizeValue(b))

const formatValue = (field: string, value: unknown): string => {
  if (field === 'isActive') return value ? 'Aktif' : 'Nonaktif'
  if (field === 'imageUrl') return value ? 'Ada' : 'Tidak ada'
  if (field === 'vendor') {
    const vendor = value as { name?: string } | null
    return vendor?.name || '-'
  }
  if (field === 'approvalStatus') {
    return APPROVAL_LABELS[value as string] || String(value ?? '-')
  }
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-'
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

export const diffProduct = (
  before: ProductSnapshot,
  after: ProductSnapshot
): ProductChange[] => {
  const changes: ProductChange[] = []
  for (const field of FIELD_ORDER) {
    if (!isEqual(before[field], after[field])) {
      if (field === 'imageUrl') {
        changes.push({ field, label: 'Gambar', from: '', to: 'Diperbarui' })
        continue
      }
      changes.push({
        field,
        label: FIELD_LABELS[field] || field,
        from: formatValue(field, before[field]),
        to: formatValue(field, after[field])
      })
    }
  }
  return changes
}

export interface ProductActor {
  uid?: string
  email?: string
  name?: string
}

export const recordProductActivities = async (
  database: D1Database,
  entries: { productId: string; changes: ProductChange[] }[],
  actor: ProductActor,
  action = 'Produk diperbarui'
) => {
  const relevant = entries.filter((entry) => entry.changes.length)
  if (!relevant.length) return

  const ts = new Date().toISOString()
  for (const entry of relevant) {
    const row = await database
      .prepare('SELECT activities FROM products WHERE id = ?')
      .bind(entry.productId)
      .first<{ activities: string | null }>()
    const activities = parseJson<ProductActivity[]>(row?.activities, [])
    activities.push({
      id: uuid(),
      userId: actor.uid || '',
      userEmail: actor.email || '',
      userName: actor.name || actor.email || '',
      action,
      changes: entry.changes,
      timestamp: ts,
      createdAt: ts
    })
    const capped = activities.slice(-100)
    await database
      .prepare('UPDATE products SET activities = ? WHERE id = ?')
      .bind(JSON.stringify(capped), entry.productId)
      .run()
  }
}

export const recordProductActivity = async (
  database: D1Database,
  productId: string,
  before: ProductSnapshot,
  after: ProductSnapshot,
  actor: ProductActor,
  action?: string
) => {
  const changes = diffProduct(before, after)
  await recordProductActivities(database, [{ productId, changes }], actor, action)
}
