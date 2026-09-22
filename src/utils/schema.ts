import { z } from 'zod'

// Category
export const orderInputForm = z.object({
  name: z
    .string({ required_error: 'Harus diisi' })
    .min(4, 'Terlalu pendek')
    .max(50, 'Terlalu panjang'),
  phoneNumber: z
    .string({ required_error: 'Harus diisi' })
    .min(8, { message: 'Nomor telepon harus terdiri dari minimal 8 karakter' })
    .max(14, {
      message: 'Nomor telepon harus terdiri dari maksimal 14 karakter'
    })
    .refine((value) => value.startsWith('+62') || value.startsWith('08'), {
      message: 'Nomor telepon harus diawali dengan +62 atau 08'
    }),
  notes: z.string().optional()
})

export const adminProductForm = z.object({
  name: z.string({ required_error: 'Nama diperlukan' }),
  sku: z.string().optional(),
  unit: z.string().optional().default('pcs'),
  isActive: z.boolean().optional(),
  priceBase: z.number({ required_error: 'Harga diperlukan' }),
  price: z.number({ required_error: 'Harga diperlukan' }),
  stock: z
    .number()
    .min(0, { message: 'Stok tidak bisa negatif' })
    .nullable()
    .optional(),
  vendor: z.object({
    id: z.string({ required_error: 'Vendor ID diperlukan' }),
    name: z.string({ required_error: 'Vendor name diperlukan' })
  }),
  categoryIds: z.array(z.string()).optional(),
  description: z.string().optional(),
  availability: z.enum(['ready', 'preorder']).optional().default('ready'),
  preorderStart: z.string().nullable().optional(),
  preorderEnd: z.string().nullable().optional(),
  channels: z.array(z.string()).optional(),
  availabilityType: z.string().optional(),
  weeklyDays: z.array(z.number()).optional(),
  specificDates: z.array(z.string()).optional(),
  preorderLeadDays: z.number().nullable().optional(),
  preorderCutoffTime: z.string().nullable().optional(),
  preorderMinQty: z.number().nullable().optional(),
  preorderMaxQty: z.number().nullable().optional(),
  preorderCapacity: z.number().nullable().optional(),
  fulfillmentType: z.string().optional(),
  discounts: z
    .array(
      z.object({
        name: z.string().optional(),
        type: z.enum(['percentage', 'fixed']),
        value: z.number({ required_error: 'Nilai diskon diperlukan' }).min(0),
        minQuantity: z.number().min(1).optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        isActive: z.boolean().optional()
      })
    )
    .optional(),
  image: z.any().optional()
})

export const adminUserForm = z.object({
  name: z.string({ required_error: 'Nama wajib diisi' }),
  email: z
    .string({ required_error: 'Email wajib diisi' })
    .email('Alamat email tidak valid'),
  password: z
    .string()
    .min(6, 'Kata sandi harus terdiri dari minimal 6 karakter')
    .optional()
    .or(z.literal('')),
  role: z.string({ required_error: 'Peran wajib diisi' })
})
