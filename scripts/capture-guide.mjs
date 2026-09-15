/**
 * Capture guide screenshots + short video clips into public/guide/.
 *
 * Two authentication modes:
 *
 *   A) Demo mode (default) — requires a TEMPORARY demo auth bypass in the app
 *      (a `bazaf_demo` cookie that resolves to an admin). Supports screenshots
 *      AND video clips. Re-add the bypass temporarily when re-capturing.
 *
 *   B) Login mode — no code changes needed. Opens real Chrome with a persistent
 *      profile; you log in once (Google), press Enter, and it captures
 *      screenshots. Session is reused on the next run.
 *
 * Usage:
 *   npm run dev
 *   npm run guide:capture                       # demo mode, screenshots
 *   npm run guide:capture -- --videos           # demo mode + video clips
 *   GUIDE_LOGIN=1 npm run guide:capture         # login mode, screenshots
 *
 * Env: GUIDE_BASE_URL, GUIDE_HEADLESS=1, GUIDE_LOGIN=1, GUIDE_PROFILE
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const BASE = process.env.GUIDE_BASE_URL || 'http://localhost:3000'
const OUT = path.resolve('public/guide')
const HEADLESS = process.env.GUIDE_HEADLESS === '1'
const LOGIN_MODE = process.env.GUIDE_LOGIN === '1'
const WITH_VIDEOS = process.argv.includes('--videos')
const PROFILE_DIR =
  process.env.GUIDE_PROFILE || path.resolve('.guide-profile')
const DESKTOP = { width: 1440, height: 900 }
const MOBILE = { width: 390, height: 844 }

const log = (...a) => console.log('[guide]', ...a)

const waitForEnter = (msg) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question(msg, () => {
      rl.close()
      resolve()
    })
  })

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: HEADLESS, channel: 'chrome' })
  } catch {
    log('Chrome tidak tersedia, memakai Chromium bawaan Playwright.')
    return await chromium.launch({ headless: HEADLESS })
  }
}

async function createDemoSession() {
  const browser = await launchBrowser()
  const context = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2
  })
  await context.addCookies([
    { name: 'bazaf_demo', value: '1', domain: 'localhost', path: '/' }
  ])
  const page = await context.newPage()
  return { browser, context, page, close: () => browser.close() }
}

async function createLoginSession() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: DESKTOP,
    deviceScaleFactor: 2
  })
  const page = context.pages()[0] || (await context.newPage())
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' })
  await waitForEnter(
    '\n[guide] Login (Google) di jendela Chrome, lalu tekan Enter di sini untuk mulai capture... '
  )
  return { context, page, close: () => context.close() }
}

async function shot(page, file) {
  const target = path.join(OUT, `${file}.png`)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  await page.screenshot({ path: target })
  log('saved', path.relative(process.cwd(), target))
}

async function go(page, url) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(900)
}

async function captureScreenshots(session) {
  const { page } = session

  await go(page, '/admin')
  const data = await page.evaluate(async () => {
    const get = async (u) => {
      try {
        const r = await fetch(u)
        return r.ok ? await r.json() : null
      } catch {
        return null
      }
    }
    const orders = await get('/api/orders')
    const invoices = await get('/api/invoices')
    const vendors = await get('/api/vendors?includeInactive=1')
    const products = await get('/api/products')
    return {
      orderId: orders?.orders?.[0]?.id || '',
      invoiceId: invoices?.invoices?.[0]?.id || '',
      vendorId: vendors?.vendors?.[0]?.id || '',
      product: products?.products?.[0] || null
    }
  })

  const vId = data.vendorId || ''
  log('ids →', { order: data.orderId, invoice: data.invoiceId, vendor: vId })

  if (data.product) {
    await page.evaluate((p) => {
      const item = {
        id: p.id,
        name: p.name,
        price: p.price,
        priceBase: p.priceBase,
        stock: p.stock,
        description: p.description,
        imageUrl: p.imageUrl,
        vendor: p.vendor,
        categories: [],
        quantity: 2,
        notes: 'Nama santri: Ahmad Fauzi, Kelas: 5A. Tanpa sambal.'
      }
      localStorage.setItem(
        'cart-bazaf',
        JSON.stringify({ state: { products: [item] }, version: 0 })
      )
    }, data.product)
  }

  const targets = [
    { file: 'admin/dasbor', url: '/admin' },
    { file: 'admin/pos', url: '/pos' },
    { file: 'admin/pesanan', url: '/admin/orders' },
    data.orderId && {
      file: 'admin/pesanan-detail',
      url: `/admin/orders/${data.orderId}`
    },
    { file: 'admin/preorder', url: '/admin/preorders' },
    { file: 'admin/produk', url: '/admin/products' },
    { file: 'admin/kategori', url: '/admin/categories' },
    { file: 'admin/kalender', url: '/admin/calendar' },
    { file: 'admin/vendor', url: '/admin/vendors' },
    { file: 'admin/invoice', url: '/admin/invoices' },
    data.invoiceId && {
      file: 'admin/invoice-detail',
      url: `/admin/invoices/${data.invoiceId}`
    },
    { file: 'admin/pengguna', url: '/admin/users' },
    { file: 'admin/pengaturan', url: '/admin/settings' },
    vId && { file: 'vendor/dashboard', url: `/dashboard?vendorId=${vId}` },
    vId && {
      file: 'vendor/produk',
      url: `/dashboard/products?vendorId=${vId}`
    },
    vId && {
      file: 'vendor/produk-tambah',
      url: `/dashboard/products/add?vendorId=${vId}`
    },
    vId && {
      file: 'vendor/pengaturan',
      url: `/dashboard/settings?vendorId=${vId}`
    },
    { file: 'pelanggan/homepage', url: '/' },
    { file: 'pelanggan/keranjang', url: '/cart' },
    data.orderId && {
      file: 'pelanggan/riwayat',
      url: `/orders/${data.orderId}`
    }
  ].filter(Boolean)

  for (const t of targets) {
    try {
      await go(page, t.url)
      await shot(page, t.file)
    } catch (err) {
      log('WARN gagal screenshot', t.file, '-', err.message)
    }
  }

  await page.setViewportSize(MOBILE)
  const mobileTargets = [
    { file: 'mobile/homepage', url: '/' },
    { file: 'mobile/admin-pesanan', url: '/admin/orders' },
    { file: 'mobile/admin-invoice', url: '/admin/invoices' },
    { file: 'mobile/admin-produk', url: '/admin/products' },
    { file: 'mobile/keranjang', url: '/cart' }
  ]
  for (const t of mobileTargets) {
    try {
      await go(page, t.url)
      await shot(page, t.file)
    } catch (err) {
      log('WARN gagal screenshot', t.file, '-', err.message)
    }
  }
}

async function recordClip(browser, name, fn) {
  const dir = path.join(OUT, '_tmp')
  fs.mkdirSync(dir, { recursive: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir, size: { width: 1280, height: 720 } }
  })
  await context.addCookies([
    { name: 'bazaf_demo', value: '1', domain: 'localhost', path: '/' }
  ])
  const page = await context.newPage()
  try {
    await fn(page)
  } catch (err) {
    log('WARN gagal rekam', name, '-', err.message)
  }
  const video = page.video()
  await page.close()
  if (video) {
    const target = path.join(OUT, `${name}.webm`)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    await video.saveAs(target)
    log('saved video', path.relative(process.cwd(), target))
  }
  await context.close()
}

async function captureVideos(browser) {
  await recordClip(browser, 'pelanggan/checkout', async (page) => {
    await go(page, '/')
    const product = await page.evaluate(async () => {
      const r = await fetch('/api/products')
      const j = await r.json()
      return j.products?.[0] || null
    })
    if (product) {
      await page.evaluate((p) => {
        localStorage.setItem(
          'cart-bazaf',
          JSON.stringify({
            state: {
              products: [
                {
                  ...p,
                  categories: [],
                  quantity: 1,
                  notes: 'Nama santri: Ahmad, Kelas: 5A'
                }
              ]
            },
            version: 0
          })
        )
      }, product)
    }
    await go(page, '/cart')
    await page.waitForTimeout(1500)
    await page
      .getByRole('button', { name: /Pesan Sekarang/i })
      .click({ timeout: 8000 })
      .catch(() => {})
    await page.waitForTimeout(2500)
  })

  await recordClip(browser, 'admin/produk-approval', async (page) => {
    await go(page, '/admin/products')
    await page.waitForTimeout(1000)
    const approve = page.getByRole('button', { name: /^Setujui$/i }).first()
    if (await approve.count()) {
      await approve.click({ timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(2000)
    }
  })

  await recordClip(browser, 'admin/pos-pembayaran', async (page) => {
    await go(page, '/pos')
    await page.waitForTimeout(1200)
    const tile = page.locator('button').filter({ hasText: /Rp/ }).first()
    if (await tile.count()) {
      await tile.click({ timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(800)
    }
    const pay = page.getByRole('button', { name: /Bayar/i }).first()
    if (await pay.count()) {
      await pay.click({ timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(2000)
    }
  })
}

async function main() {
  log('base', BASE, '→ output', path.relative(process.cwd(), OUT))
  log('mode', LOGIN_MODE ? 'login (persistent Chrome)' : 'demo cookie')

  const session = LOGIN_MODE
    ? await createLoginSession()
    : await createDemoSession()

  try {
    await captureScreenshots(session)
  } finally {
    if (WITH_VIDEOS && !LOGIN_MODE && session.browser) {
      await captureVideos(session.browser)
    } else if (WITH_VIDEOS && LOGIN_MODE) {
      log('Video klip dilewati di mode login. Pakai demo mode untuk merekam.')
    }
    await session.close()
  }
  log('selesai.')
}

main().catch((err) => {
  console.error('[guide] ERROR', err)
  process.exit(1)
})
