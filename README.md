# Bazaf

Aplikasi toko makanan berbasis web yang di-deploy ke Cloudflare Workers menggunakan [vinext](https://www.npmjs.com/package/vinext) (reimplementasi Next.js berbasis Vite).

## Scripts

```bash
# Menjalankan development server
npm run dev

# Build produksi
npm run build

# Menjalankan worker hasil build secara lokal
npm start

# Lint
npm run lint

# Migrasi database D1
npm run db:migrate:local
npm run db:migrate:remote

# Deploy ke Cloudflare Workers
npm run deploy
```

## Environment

Salin `.env.example` menjadi `.env.local` dan isi nilai yang dibutuhkan sebelum menjalankan aplikasi.
