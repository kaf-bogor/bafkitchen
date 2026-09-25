export type GuideRoleId = 'umum' | 'admin' | 'vendor' | 'pelanggan'

export type GuideMediaType = 'image' | 'video' | 'gif' | 'embed'

export interface GuideMediaItem {
  type: GuideMediaType
  src: string
  caption?: string
}

export interface GuideSection {
  id: string
  title: string
  role: GuideRoleId
  description?: string
  steps?: string[]
  media?: GuideMediaItem[]
}

export interface GuideRole {
  id: GuideRoleId
  name: string
  description: string
}

export const GUIDE_ROLES: GuideRole[] = [
  {
    id: 'admin',
    name: 'Admin',
    description:
      'Mengelola seluruh toko: produk, pesanan, invoice, vendor, pengguna, dan pengaturan.'
  },
  {
    id: 'vendor',
    name: 'Vendor',
    description:
      'Penjual yang menautkan produknya. Melihat invoice, menambah produk (perlu persetujuan admin), dan mengatur profil.'
  },
  {
    id: 'pelanggan',
    name: 'Pelanggan',
    description:
      'Membeli dari storefront: menelusuri produk, menambahkan ke keranjang, lalu checkout via WhatsApp.'
  }
]

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'peran',
    title: 'Peran pengguna & alur singkat',
    role: 'umum',
    description:
      'Aplikasi memiliki tiga peran. Alur bisnis: pelanggan memesan → admin memproses pesanan → sistem membuat invoice → vendor melihat invoice dan menambahkan produk.',
    steps: [
      'Admin login lewat Google di /admin/login.',
      'Vendor login lewat /login (setelah akunnya ditautkan ke vendor oleh admin).',
      'Pelanggan tidak wajib login untuk melihat produk; login diperlukan untuk pengalaman penuh.',
      'Semua order masuk ke admin. Admin memproses sampai invoice diterbitkan.'
    ]
  },
  {
    id: 'login',
    title: 'Login & akses',
    role: 'umum',
    description: 'Cara masuk ke tiap area aplikasi.',
    steps: [
      'Admin: buka /admin/login, klik "Masuk dengan Google". Hanya email admin yang bisa masuk.',
      'Vendor: buka /login dan masuk, lalu Anda diarahkan ke /dashboard.',
      'Jika akun non-admin membuka /admin, otomatis dialihkan ke /dashboard.'
    ]
  },

  {
    id: 'admin-dasbor',
    title: 'Dasbor admin',
    role: 'admin',
    description:
      'Ringkasan performa toko: statistik pesanan, pendapatan, grafik, dan order terbaru.',
    steps: [
      'Buka menu Dasbor.',
      'Pilih rentang waktu (Hari ini / 7 hari / 30 hari).',
      'Lihat kartu statistik dan grafik, serta tabel "Order terbaru".'
    ],
    media: [
      { type: 'image', src: '/guide/admin/dasbor.png', caption: 'Dasbor admin' }
    ]
  },
  {
    id: 'admin-pos',
    title: 'Kasir (POS)',
    role: 'admin',
    description:
      'Melayani penjualan langsung di tempat: pilih produk, bayar, dan cetak struk.',
    steps: [
      'Buka menu Kasir (POS).',
      'Cari/pilih produk lalu tambahkan ke keranjang kanan.',
      'Klik Bayar, pilih metode pembayaran dan nominal.',
      'Struk tampil dan transaksi tersimpan. Riwayat & ringkasan harian ada di topbar.'
    ],
    media: [
      { type: 'image', src: '/guide/admin/pos.png', caption: 'Halaman kasir' },
      {
        type: 'video',
        src: '/guide/admin/pos-pembayaran.webm',
        caption: 'Klip: proses pembayaran di kasir'
      }
    ]
  },
  {
    id: 'admin-pesanan',
    title: 'Pesanan',
    role: 'admin',
    description:
      'Melihat dan memproses semua pesanan, mengubah status, dan mencatat bukti pembayaran.',
    steps: [
      'Buka menu Pesanan. Gunakan filter tanggal/produk/vendor dan pencarian.',
      'Klik ikon mata untuk membuka detail pesanan.',
      'Ubah status lewat tombol aksi (mis. Konfirmasi Pembayaran) dengan dialog konfirmasi.',
      'Saat konfirmasi pembayaran, unggah bukti pembayaran (bisa diubah lagi dari detail).'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/admin/pesanan.png',
        caption: 'Daftar pesanan'
      },
      {
        type: 'image',
        src: '/guide/admin/pesanan-detail.png',
        caption: 'Detail pesanan & riwayat aktivitas'
      }
    ]
  },
  {
    id: 'admin-preorder',
    title: 'Pre-order',
    role: 'admin',
    description:
      'Memantau pesanan pre-order/catering dan tanggal pemenuhannya.',
    steps: [
      'Buka menu Pre-order.',
      'Lihat ringkasan di kartu atas.',
      'Filter berdasarkan tab status.',
      'Klik ikon mata untuk membuka detail pesanan.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/admin/preorder.png',
        caption: 'Daftar pre-order'
      }
    ]
  },
  {
    id: 'admin-produk',
    title: 'Produk & persetujuan',
    role: 'admin',
    description:
      'Mengelola katalog produk dan menyetujui produk yang diajukan vendor.',
    steps: [
      'Buka menu Produk.',
      'Gunakan filter status untuk melihat produk "Menunggu persetujuan".',
      'Klik Setujui atau Tolak pada produk yang diajukan vendor.',
      'Tambah/Ubah produk langsung dari admin bila perlu.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/admin/produk.png',
        caption: 'Daftar produk & approval'
      },
      {
        type: 'video',
        src: '/guide/admin/produk-approval.webm',
        caption: 'Klip: menyetujui produk vendor'
      }
    ]
  },
  {
    id: 'admin-kategori',
    title: 'Kategori',
    role: 'admin',
    description: 'Mengelompokkan produk dengan kategori.',
    steps: [
      'Buka menu Kategori.',
      'Klik Tambah kategori untuk membuat kategori baru.',
      'Gunakan menu ⋮ pada baris untuk mengubah.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/admin/kategori.png',
        caption: 'Daftar kategori'
      }
    ]
  },
  {
    id: 'admin-kalender',
    title: 'Kalender',
    role: 'admin',
    description: 'Melihat pesanan berdasarkan tanggal pemenuhan.',
    steps: [
      'Buka menu Kalender.',
      'Pilih tanggal untuk melihat pesanan pada hari tersebut.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/admin/kalender.png',
        caption: 'Kalender pesanan'
      }
    ]
  },
  {
    id: 'admin-vendor',
    title: 'Vendor',
    role: 'admin',
    description:
      'Mengelola vendor dan tipe-nya (Bazaf / Baf Kitchen / Keduanya).',
    steps: [
      'Buka menu Vendor.',
      'Ubah tipe vendor langsung lewat dropdown pada baris.',
      'Klik ⋮ → Lihat dashboard untuk membuka dashboard vendor (impersonate).'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/admin/vendor.png',
        caption: 'Daftar vendor'
      }
    ]
  },
  {
    id: 'admin-invoice',
    title: 'Invoice',
    role: 'admin',
    description:
      'Memantau invoice vendor, menandai lunas, dan mengekspor laporan.',
    steps: [
      'Buka menu Invoice.',
      'Gunakan pencarian & filter (status/vendor/tanggal).',
      'Klik ⋮ → Rincian untuk melihat detail; ⋮ → Tandai lunas untuk melunasi.',
      'Gunakan tombol Export untuk CSV atau PDF.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/admin/invoice.png',
        caption: 'Daftar invoice'
      },
      {
        type: 'image',
        src: '/guide/admin/invoice-detail.png',
        caption: 'Detail invoice'
      }
    ]
  },
  {
    id: 'admin-pengguna',
    title: 'Pengguna',
    role: 'admin',
    description: 'Mengelola pengguna, peran, dan impersonate vendor.',
    steps: [
      'Buka menu Pengguna.',
      'Tambah pengguna lewat tombol Tambah pengguna.',
      'Klik ⋮ → Ubah/Hapus untuk mengelola, atau Impersonate vendor untuk melihat sebagai vendor.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/admin/pengguna.png',
        caption: 'Daftar pengguna'
      }
    ]
  },
  {
    id: 'admin-pengaturan',
    title: 'Pengaturan',
    role: 'admin',
    description: 'Mengatur nomor WhatsApp admin, nama aplikasi, dan domain.',
    steps: [
      'Buka menu Pengaturan.',
      'Isi nomor admin, nama aplikasi, dan domain.',
      'Klik Simpan.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/admin/pengaturan.png',
        caption: 'Pengaturan aplikasi'
      }
    ]
  },

  {
    id: 'vendor-dashboard',
    title: 'Dashboard vendor',
    role: 'vendor',
    description: 'Ringkasan invoice vendor beserta status pembayarannya.',
    steps: [
      'Buka menu Home.',
      'Lihat kartu statistik invoice dan tabel invoice Anda.',
      'Filter berdasarkan status, lalu klik Lihat detail.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/vendor/dashboard.png',
        caption: 'Dashboard vendor'
      }
    ]
  },
  {
    id: 'vendor-produk',
    title: 'Produk vendor',
    role: 'vendor',
    description:
      'Menambahkan dan mengubah produk sendiri. Produk baru menunggu persetujuan admin.',
    steps: [
      'Buka menu Produk.',
      'Klik Tambah produk, lengkapi form, lalu Simpan.',
      'Produk berstatus "Menunggu" sampai disetujui admin.',
      'Ubah produk kapan saja; perubahan akan ditinjau ulang admin.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/vendor/produk.png',
        caption: 'Produk vendor'
      },
      {
        type: 'image',
        src: '/guide/vendor/produk-tambah.png',
        caption: 'Form tambah produk'
      }
    ]
  },
  {
    id: 'vendor-pengaturan',
    title: 'Pengaturan vendor',
    role: 'vendor',
    description: 'Mengubah nama, tipe vendor, dan melihat aktivitas terbaru.',
    steps: [
      'Buka menu Setting.',
      'Ubah Nama dan Jenis vendor, lalu Simpan.',
      'Lihat Aktivitas terbaru pada panel kanan.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/vendor/pengaturan.png',
        caption: 'Pengaturan vendor'
      }
    ]
  },

  {
    id: 'pelanggan-homepage',
    title: 'Menelusuri produk',
    role: 'pelanggan',
    description:
      'Beranda storefront: cari produk, filter kategori/vendor, dan pilih tab Tersedia atau Pre-order.',
    steps: [
      'Gunakan kolom pencarian di kanan atas.',
      'Pilih kategori/vendor lewat dropdown filter.',
      'Pindah tab antara "Tersedia" dan "Pre-order".',
      'Klik Tambah pada produk untuk memasukkannya ke keranjang.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/pelanggan/homepage.png',
        caption: 'Beranda storefront'
      }
    ]
  },
  {
    id: 'pelanggan-keranjang',
    title: 'Keranjang',
    role: 'pelanggan',
    description:
      'Mengatur jumlah item, menambah catatan per produk (mis. nama santri & kelas), dan melihat total.',
    steps: [
      'Buka keranjang lewat ikon keranjang atau bilah bawah.',
      'Atur jumlah dengan tombol − / +.',
      'Isi "Catatan untuk item ini" (contoh: Nama santri & kelas, permintaan khusus).',
      'Isi data pemesan, lalu klik Pesan Sekarang.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/pelanggan/keranjang.png',
        caption: 'Halaman keranjang'
      }
    ]
  },
  {
    id: 'pelanggan-checkout',
    title: 'Checkout via WhatsApp',
    role: 'pelanggan',
    description:
      'Setelah menekan Pesan Sekarang, pesanan tersimpan dan WhatsApp terbuka berisi rincian pesanan.',
    steps: [
      'Tekan "Pesan Sekarang" pada keranjang.',
      'WhatsApp terbuka otomatis berisi rincian pesanan Anda.',
      'Kirim pesan ke admin untuk konfirmasi.'
    ],
    media: [
      {
        type: 'video',
        src: '/guide/pelanggan/checkout.webm',
        caption: 'Klip: checkout sampai WhatsApp terkirim'
      }
    ]
  },
  {
    id: 'pelanggan-riwayat',
    title: 'Riwayat pesanan',
    role: 'pelanggan',
    description: 'Melihat status dan rincian pesanan yang pernah dibuat.',
    steps: [
      'Buka halaman detail pesanan dari tautan yang diberikan.',
      'Lihat item, total, dan status pesanan.'
    ],
    media: [
      {
        type: 'image',
        src: '/guide/pelanggan/riwayat.png',
        caption: 'Detail pesanan'
      }
    ]
  }
]
