import { openDB } from 'idb';

const DB_NAME = 'pos-offline-db';
const DB_VERSION = 1;

let dbInstance = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('by-store', 'store_id');
        productStore.createIndex('by-category', 'category_id');
      }

      // Categories store
      if (!db.objectStoreNames.contains('categories')) {
        const catStore = db.createObjectStore('categories', { keyPath: 'id' });
        catStore.createIndex('by-store', 'store_id');
      }

      // Pending orders queue
      if (!db.objectStoreNames.contains('pending_orders')) {
        db.createObjectStore('pending_orders', { keyPath: 'local_id' });
      }

      // Sync log
      if (!db.objectStoreNames.contains('sync_log')) {
        db.createObjectStore('sync_log', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
    },
  });

  return dbInstance;
}

// ─── PRODUCT CACHE ────────────────────────────────────────────

export async function cacheProducts(products, storeId) {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  const index = tx.store.index('by-store');
  const existingKeys = await index.getAllKeys(storeId);
  for (const key of existingKeys) {
    await tx.store.delete(key);
  }
  for (const product of products) {
    const id = product.id || product._id;
    await tx.store.put({ ...product, id, store_id: storeId });
  }
  await tx.done;
}

export async function getCachedProducts(storeId) {
  const db = await getDB();
  return db.getAllFromIndex('products', 'by-store', storeId);
}

// ─── CATEGORY CACHE ───────────────────────────────────────────

export async function cacheCategories(categories, storeId) {
  const db = await getDB();
  const tx = db.transaction('categories', 'readwrite');
  const index = tx.store.index('by-store');
  const existingKeys = await index.getAllKeys(storeId);
  for (const key of existingKeys) {
    await tx.store.delete(key);
  }
  for (const cat of categories) {
    const id = cat.id || cat._id;
    await tx.store.put({ ...cat, id, store_id: storeId });
  }
  await tx.done;
}

export async function getCachedCategories(storeId) {
  const db = await getDB();
  return db.getAllFromIndex('categories', 'by-store', storeId);
}

// ─── PENDING ORDERS ───────────────────────────────────────────

export async function savePendingOrder(order) {
  const db = await getDB();
  await db.put('pending_orders', order);
}

export async function getAllPendingOrders() {
  const db = await getDB();
  return db.getAll('pending_orders');
}

export async function deletePendingOrder(localId) {
  const db = await getDB();
  await db.delete('pending_orders', localId);
}

export async function updatePendingOrderError(localId, error) {
  const db = await getDB();
  const order = await db.get('pending_orders', localId);
  if (order) {
    order.sync_error = error;
    order.sync_attempts = (order.sync_attempts || 0) + 1;
    await db.put('pending_orders', order);
  }
}

export async function getPendingOrderCount() {
  const db = await getDB();
  return db.count('pending_orders');
}

// ─── SYNC LOG ─────────────────────────────────────────────────

export async function logSync(entry) {
  const db = await getDB();
  await db.add('sync_log', entry);
}
