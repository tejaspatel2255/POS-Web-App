// src/lib/offlineDb.ts
import { openDB } from 'idb'
import { Product, Category } from '../types'

const DB_NAME = 'universal_pos_db'
const DB_VERSION = 1

export async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
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

export async function savePendingOrder(order: any): Promise<void> {
  const db = await getDb()
  const localId = order.localId || order.id || Date.now().toString()
  await db.put('pending_orders', { ...order, localId })
}

export async function getPendingOrders(): Promise<any[]> {
  const db = await getDb()
  return db.getAll('pending_orders')
}

export async function deletePendingOrder(localId: string): Promise<void> {
  const db = await getDb()
  await db.delete('pending_orders', localId)
}

export async function cacheProducts(storeId: string, products: Product[]): Promise<void> {
  const db = await getDb()
  await db.put('cached_products', { store_id: storeId, products })
}

export async function getCachedProducts(storeId: string): Promise<Product[]> {
  const db = await getDb()
  const entry = await db.get('cached_products', storeId)
  return entry ? entry.products : []
}

export async function cacheCategories(storeId: string, categories: Category[]): Promise<void> {
  const db = await getDb()
  await db.put('cached_categories', { store_id: storeId, categories })
}

export async function getCachedCategories(storeId: string): Promise<Category[]> {
  const db = await getDb()
  const entry = await db.get('cached_categories', storeId)
  return entry ? entry.categories : []
}
