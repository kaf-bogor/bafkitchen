#!/usr/bin/env node
// Migration: Firebase Firestore -> Cloudflare D1
// Reads publicly-accessible collections (products, categories, schedules)
// via the Firestore REST API using the web API key, and emits a SQL file
// compatible with the D1 schema (d1/migrations/0001_init.sql).
//
// Usage:
//   node scripts/migrate-firestore.mjs \
//     --project bafstore-f2842 --db bafkitchen-db \
//     --key AIza... --out ./migrated.sql
//
// Public collections (products, categories, schedules) read with just --key.
// Protected collections (users, vendors, orders, invoices) require admin auth:
//   --firebase-cli   read access token from the Firebase CLI config store
//                    (run `firebase projects:list` first to refresh the token)
//   --token <ID_TOKEN>   an existing Firebase/Google access token
//   --email <E> --password <P>   sign in with Firebase email/password auth

import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const getArg = (name) => {
  const i = args.indexOf(name)
  return i > -1 ? args[i + 1] : undefined
}

const PROJECT = getArg('--project') || process.env.FIREBASE_PROJECT_ID
const DB = getArg('--db') || 'bafkitchen-db'
const KEY = getArg('--key') || process.env.NEXT_PUBLIC_FIREBASE_API_KEY
const OUT = getArg('--out') || './migrated.sql'
const ADMIN_TOKEN = getArg('--token')
const ADMIN_EMAIL = getArg('--email')
const ADMIN_PASSWORD = getArg('--password')
const USE_FIREBASE_CLI = args.includes('--firebase-cli')

let activeToken = ADMIN_TOKEN || null

// Read access token from the Firebase CLI config store (token refreshed by running any `firebase` command)
function getTokenFromFirebaseCli() {
  const configPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json')
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const accessToken = config?.tokens?.access_token
  if (!accessToken) throw new Error('No access_token found in Firebase CLI config. Run `firebase projects:list` to refresh it first.')
  return accessToken
}

if (!PROJECT || !KEY) {
  console.error('Missing --project or --key')
  process.exit(1)
}

// Sign in with email/password to obtain an admin ID token (Firebase Auth REST API)
async function getAdminToken(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  )
  const data = await res.json()
  if (!res.ok || !data.idToken) {
    throw new Error(
      `Firebase sign-in failed: ${res.status} ${(data.error?.message) || JSON.stringify(data)}`
    )
  }
  return data.idToken
}

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${DB}/documents`

async function fetchAll(collection) {
  const docs = []
  let pageToken = ''
  for (;;) {
    const url =
      `${BASE}/${collection}?pageSize=300&key=${KEY}` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '')
    const res = await fetch(url, {
      headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {}
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`${collection}: ${res.status} ${text.slice(0, 200)}`)
    }
    const data = await res.json()
    docs.push(...(data.documents || []))
    if (!data.nextPageToken) break
    pageToken = data.nextPageToken
  }
  return docs.map((doc) => ({
    id: doc.name.split('/').pop(),
    fields: doc.fields || {}
  }))
}

// Decode Firestore REST value object -> plain JS value
function decode(v) {
  if (!v) return null
  const [key, value] = Object.entries(v)[0]
  switch (key) {
    case 'nullValue':
      return null
    case 'booleanValue':
      return value
    case 'integerValue':
    case 'doubleValue':
      return typeof value === 'number' ? value : Number(value)
    case 'timestampValue':
      return new Date(value).toISOString()
    case 'stringValue':
      return value
    case 'bytesValue':
      return value
    case 'referenceValue':
      return value
    case 'geoPointValue':
      return value
    case 'arrayValue':
      return (value.values || []).map(decode)
    case 'mapValue':
      return decodeMap(value.fields || {})
    default:
      return null
  }
}

function decodeMap(fields) {
  const obj = {}
  for (const [k, v] of Object.entries(fields)) obj[k] = decode(v)
  return obj
}

const sqlStr = (s) =>
  `'${String(s ?? '')
    .replace(/'/g, "''")
    .replace(/\0/g, '')
    .trim()}'`

const iso = (v) => {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

const lines = []
const productCategoryRows = []

const now = new Date().toISOString()

async function migrateProducts() {
  const docs = await fetchAll('products')
  for (const doc of docs) {
    const f = doc.fields
    const vendor = f.vendor ? decode(f.vendor) : null
    const categoryIds = f.categoryIds ? decode(f.categoryIds) : []
    const createdAt = iso(f.createdAt ? decode(f.createdAt) : null) || now
    const updatedAt = iso(f.updatedAt ? decode(f.updatedAt) : null) || now

    lines.push(`INSERT INTO products (id, name, price_base, price, stock, vendor, category_ids, description, image_url, image_key, availability, preorder_start, preorder_end, created_at, updated_at) VALUES (${sqlStr(doc.id)}, ${sqlStr(f.name ? decode(f.name) : '')}, ${Number(f.priceBase ? decode(f.priceBase) : 0) || 0}, ${Number(f.price ? decode(f.price) : 0) || 0}, ${Number(f.stock ? decode(f.stock) : 0) || 0}, ${f.vendor ? sqlStr(JSON.stringify(vendor)) : 'NULL'}, ${sqlStr(JSON.stringify(categoryIds))}, ${sqlStr(f.description ? decode(f.description) : '')}, ${sqlStr(f.imageUrl ? decode(f.imageUrl) : '')}, NULL, 'ready', NULL, NULL, ${sqlStr(createdAt)}, ${sqlStr(updatedAt)});`)

    for (const cid of categoryIds) {
      productCategoryRows.push(`INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (${sqlStr(doc.id)}, ${sqlStr(cid)});`)
    }
  }
  console.log(`products: ${docs.length}`)
}

async function migrateCategories() {
  const docs = await fetchAll('categories')
  for (const doc of docs) {
    const f = doc.fields
    const createdAt = iso(f.createdAt ? decode(f.createdAt) : null) || now
    const updatedAt = iso(f.updatedAt ? decode(f.updatedAt) : null) || now
    lines.push(`INSERT INTO categories (id, name, vendor_id, created_at, updated_at) VALUES (${sqlStr(doc.id)}, ${sqlStr(f.name ? decode(f.name) : '')}, ${f.vendorId ? sqlStr(decode(f.vendorId)) : 'NULL'}, ${sqlStr(createdAt)}, ${sqlStr(updatedAt)});`)
  }
  console.log(`categories: ${docs.length}`)
}

async function migrateSchedules() {
  const docs = await fetchAll('schedules')
  for (const doc of docs) {
    const f = doc.fields
    const date = f.date ? decode(f.date) : ''
    const products = f.products ? decode(f.products) : []
    const createdAt = iso(f.createdAt ? decode(f.createdAt) : null) || now
    const updatedAt = iso(f.updatedAt ? decode(f.updatedAt) : null) || now
    lines.push(`INSERT INTO schedules (id, date, products, created_at, updated_at) VALUES (${sqlStr(doc.id)}, ${sqlStr(date)}, ${sqlStr(JSON.stringify(products))}, ${sqlStr(createdAt)}, ${sqlStr(updatedAt)});`)
  }
  console.log(`schedules: ${docs.length}`)
}

async function migrateUsers() {
  const docs = await fetchAll('users')
  for (const doc of docs) {
    const f = doc.fields
    const createdAt = iso(f.createdAt ? decode(f.createdAt) : null) || now
    const updatedAt = iso(f.updatedAt ? decode(f.updatedAt) : null) || now
    const lastSignInAt = f.lastSignInAt ? iso(decode(f.lastSignInAt)) : null
    const role = f.role ? decode(f.role) : 'customer'
    lines.push(`INSERT INTO users (id, name, email, role, phone_number, photo_url, password_hash, created_at, updated_at, last_sign_in_at) VALUES (${sqlStr(doc.id)}, ${sqlStr(f.name ? decode(f.name) : '')}, ${sqlStr(f.email ? decode(f.email) : '')}, ${sqlStr(role)}, ${f.phoneNumber ? sqlStr(decode(f.phoneNumber)) : 'NULL'}, ${f.photoURL || f.photoUrl ? sqlStr(decode(f.photoURL || f.photoUrl)) : 'NULL'}, NULL, ${sqlStr(createdAt)}, ${sqlStr(updatedAt)}, ${lastSignInAt ? sqlStr(lastSignInAt) : 'NULL'});`)
  }
  console.log(`users: ${docs.length}`)
}

async function migrateVendors() {
  const docs = await fetchAll('vendors')
  for (const doc of docs) {
    const f = doc.fields
    const createdAt = iso(f.createdAt ? decode(f.createdAt) : null) || now
    const updatedAt = iso(f.updatedAt ? decode(f.updatedAt) : null) || now
    const isActive = f.isActive ? (decode(f.isActive) ? 1 : 0) : 1
    lines.push(`INSERT INTO vendors (id, name, email, is_active, user_id, created_at, updated_at) VALUES (${sqlStr(doc.id)}, ${sqlStr(f.name ? decode(f.name) : '')}, ${f.email ? sqlStr(decode(f.email)) : 'NULL'}, ${isActive}, ${f.userId ? sqlStr(decode(f.userId)) : 'NULL'}, ${sqlStr(createdAt)}, ${sqlStr(updatedAt)});`)
  }
  console.log(`vendors: ${docs.length}`)
}

async function migrateOrders() {
  const docs = await fetchAll('orders')
  for (const doc of docs) {
    const f = doc.fields
    const createdAt = iso(f.createdAt ? decode(f.createdAt) : null) || now
    const updatedAt = iso(f.updatedAt ? decode(f.updatedAt) : null) || now
    const total = Number(f.total ? decode(f.total) : 0) || 0
    lines.push(`INSERT INTO orders (id, order_number, product_orders, total, customer, status, store, vendors, channel, payment, cashier, activities, created_at, updated_at) VALUES (${sqlStr(doc.id)}, ${f.orderNumber ? sqlStr(decode(f.orderNumber)) : 'NULL'}, ${sqlStr(JSON.stringify(f.productOrders ? decode(f.productOrders) : []))}, ${total}, ${sqlStr(JSON.stringify(f.customer ? decode(f.customer) : {}))}, ${sqlStr(f.status ? decode(f.status) : '')}, ${sqlStr(JSON.stringify(f.store ? decode(f.store) : {}))}, ${sqlStr(JSON.stringify(f.vendors ? decode(f.vendors) : []))}, ${f.channel ? sqlStr(decode(f.channel)) : 'NULL'}, ${f.payment ? sqlStr(JSON.stringify(decode(f.payment))) : 'NULL'}, ${f.cashier ? sqlStr(decode(f.cashier)) : 'NULL'}, ${sqlStr(JSON.stringify(f.activities ? decode(f.activities) : []))}, ${sqlStr(createdAt)}, ${sqlStr(updatedAt)});`)
  }
  console.log(`orders: ${docs.length}`)
}

async function migrateInvoices() {
  const docs = await fetchAll('invoices')
  for (const doc of docs) {
    const f = doc.fields
    const createdAt = iso(f.createdAt ? decode(f.createdAt) : null) || now
    const updatedAt = iso(f.updatedAt ? decode(f.updatedAt) : null) || now
    const totalAmount = Number(f.totalAmount ? decode(f.totalAmount) : 0) || 0
    const dueDate = f.dueDate ? iso(decode(f.dueDate)) : null
    const issuedDate = f.issuedDate ? iso(decode(f.issuedDate)) : null
    const settledDate = f.settledDate ? iso(decode(f.settledDate)) : null
    lines.push(`INSERT INTO invoices (id, invoice_number, order_id, vendor_id, vendor_name, total_amount, status, due_date, issued_date, settled_date, items, customer, commission, created_at, updated_at) VALUES (${sqlStr(doc.id)}, ${f.invoiceNumber ? sqlStr(decode(f.invoiceNumber)) : 'NULL'}, ${f.orderId ? sqlStr(decode(f.orderId)) : 'NULL'}, ${f.vendorId ? sqlStr(decode(f.vendorId)) : 'NULL'}, ${f.vendorName ? sqlStr(decode(f.vendorName)) : 'NULL'}, ${totalAmount}, ${sqlStr(f.status ? decode(f.status) : 'Issued')}, ${dueDate ? sqlStr(dueDate) : 'NULL'}, ${issuedDate ? sqlStr(issuedDate) : 'NULL'}, ${settledDate ? sqlStr(settledDate) : 'NULL'}, ${sqlStr(JSON.stringify(f.items ? decode(f.items) : []))}, ${sqlStr(JSON.stringify(f.customer ? decode(f.customer) : {}))}, ${f.commission ? sqlStr(JSON.stringify(decode(f.commission))) : 'NULL'}, ${sqlStr(createdAt)}, ${sqlStr(updatedAt)});`)
  }
  console.log(`invoices: ${docs.length}`)
}

async function main() {
  try {
    if (USE_FIREBASE_CLI && !activeToken) {
      console.log('Using Firebase CLI session to obtain access token...')
      activeToken = await getTokenFromFirebaseCli()
    } else if (ADMIN_EMAIL && ADMIN_PASSWORD && !activeToken) {
      console.log('Signing in to obtain admin token...')
      activeToken = await getAdminToken(ADMIN_EMAIL, ADMIN_PASSWORD)
    }

    await migrateProducts()
    await migrateCategories()
    await migrateSchedules()
    if (activeToken) {
      await migrateUsers()
      await migrateVendors()
      await migrateOrders()
      await migrateInvoices()
    } else {
      console.log('Skipping users/vendors/orders/invoices (no --token, --email/--password, or --firebase-cli)')
    }
    lines.push(...productCategoryRows)

    const header =
      '-- Generated by scripts/migrate-firestore.mjs\n' +
      '-- Firestore -> D1 data migration\n\n'
    writeFileSync(OUT, header + lines.join('\n') + '\n')
    console.log(`\nWrote ${lines.length} statements to ${OUT}`)
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  }
}

main()
