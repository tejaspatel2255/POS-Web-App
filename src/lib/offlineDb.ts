// File Path: d:/Projects/Web/Universal POS/src/lib/offlineDb.ts

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Product, Category } from '../types'

const DB_NAME = 'universal_pos_offline'
const DB_VERSION = 1

interface PendingOrderItem {
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  discount_percent: number
  line_total: number
}

export interface PendingOrder {
  localId: string          // UUID generated client-side
  store_id: string
  cashier_id: string | null
  order_type: string
  status: string
  payment_method: string
  customer_name: string | null
  customer_phone: string | null
  subtotal: number
  discount_percent: number
  discount_amount: number
  parcel_charges: number
  tax_amount: number
  total: number
  note: string | null
  is_synced: boolean
  created_at: string
  items: PendingOrderItem[]
}

interface CachedProductsStore {
  store_id: string
  products: Product[]
  cached_at: string
}

interface CachedCategoriesStore {
  store_id: string
  categories: Category[]
  cached_at: string
}

interface UniversalPOSDB extends DBSchema {
  pending_orders: {
    key: string                // localId
    value: PendingOrder
  }
  cached_products: {
    key: string                // store_id
    value: CachedProductsStore
  }
  cached_categories: {
    key: string                // store_id
    value: CachedCategoriesStore
  }
}

let dbPromise: Promise<IDBPDatabase<UniversalPOSDB>> | null = null

function getDB(): Promise<IDBPDatabase<UniversalPOSDB>> {
  if (!dbPromise) {
    dbPromise = openDB<UniversalPOSDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending_orders')) {
          db.createObjectStore('pending_orders', { keyPath: 'localId' })
        }
        if (!db.objectStoreNames.contains('cached_products')) {
          db.createObjectStore('cached_products', { keyPath: 'store_id' })
        }
        if (!db.objectStoreNames.contains('cached_categories')) {
          db.createObjectStore('cached_categories', { keyPath: 'store_id' })
        }
      },
    })
  }
  return dbPromise
}

// ── Pending Orders ──────────────────────────────────────────────────────────

export async function savePendingOrder(order: PendingOrder): Promise<void> {
  const db = await getDB()
  await db.put('pending_orders', { ...order, is_synced: false })
}

export async function getPendingOrders(): Promise<PendingOrder[]> {
  const db = await getDB()
  return db.getAll('pending_orders')
}

export async function deletePendingOrder(localId: string): Promise<void> {
  const db = await getDB()
  await db.delete('pending_orders', localId)
}

export async function getPendingOrderCount(): Promise<number> {
  const db = await getDB()
  return db.count('pending_orders')
}

// ── Cached Products ─────────────────────────────────────────────────────────

export async function cacheProducts(storeId: string, products: Product[]): Promise<void> {
  const db = await getDB()
  await db.put('cached_products', {
    store_id: storeId,
    products,
    cached_at: new Date().toISOString(),
  })
}

export async function getCachedProducts(storeId: string): Promise<Product[]> {
  const db = await getDB()
  const record = await db.get('cached_products', storeId)
  return record?.products ?? []
}

// ── Cached Categories ───────────────────────────────────────────────────────

export async function cacheCategories(storeId: string, categories: Category[]): Promise<void> {
  const db = await getDB()
  await db.put('cached_categories', {
    store_id: storeId,
    categories,
    cached_at: new Date().toISOString(),
  })
}

export async function getCachedCategories(storeId: string): Promise<Category[]> {
  const db = await getDB()
  const record = await db.get('cached_categories', storeId)
  return record?.categories ?? []
}
