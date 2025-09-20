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
  namaSantri: z
    .string({ required_error: 'Nama santri harus diisi' })
    .min(2, 'Nama santri terlalu pendek')
    .max(50, 'Nama santri terlalu panjang'),
  kelas: z
    .string({ required_error: 'Kelas harus diisi' })
    .min(1, 'Kelas harus diisi'),
  notes: z.string().optional()
})

export const adminProductForm = z.object({
  name: z.string({ required_error: 'Nama diperlukan' }),
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
  image: z.any().optional()
})

export const adminUserForm = z.object({
  name: z.string({ required_error: 'Nama wajib diisi' }),
  email: z
    .string({ required_error: 'Email wajib diisi' })
    .email('Alamat email tidak valid'),
  password: z
    .string({ required_error: 'Kata sandi wajib diisi' })
    .min(6, 'Kata sandi harus terdiri dari minimal 6 karakter'),
  role: z.string({ required_error: 'Peran wajib diisi' })
})
