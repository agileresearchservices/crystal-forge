import type { StorageConfig, DBInitResult } from './types';

const DB_NAME = 'crystal-forge-db';
const DB_VERSION = 1;

/**
 * Storage configuration for IndexedDB
 */
const storageConfig: StorageConfig = {
  dbName: DB_NAME,
  version: DB_VERSION,
  stores: {
    templates: {
      keyPath: 'id',
      indexes: [
        { name: 'category', keyPath: 'category' },
        { name: 'created_at', keyPath: 'created_at' },
        { name: 'name', keyPath: 'name' },
      ],
    },
    history: {
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'index_name', keyPath: 'index_name' },
      ],
    },
    aggregations: {
      keyPath: 'id',
      indexes: [
        { name: 'category', keyPath: 'category' },
        { name: 'agg_type', keyPath: 'agg_type' },
      ],
    },
  },
};

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<DBInitResult> | null = null;

/**
 * Initialize IndexedDB database with proper store creation
 */
export async function initDB(): Promise<DBInitResult> {
  // Return existing promise if initialization is already in progress
  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve) => {
    // Check if IndexedDB is available
    if (!('indexedDB' in window)) {
      const result: DBInitResult = {
        success: false,
        db: null,
        error: 'IndexedDB is not available in this browser',
      };
      resolve(result);
      return;
    }

    // Return existing instance if already initialized
    if (dbInstance) {
      resolve({
        success: true,
        db: dbInstance,
        error: null,
      });
      return;
    }

    // Helper function to check and recreate stores if needed
    const checkAndCreateStores = (db: IDBDatabase) => {
      const missingStores = Object.keys(storageConfig.stores).filter(
        (storeName) => !db.objectStoreNames.contains(storeName)
      );

      if (missingStores.length > 0) {
        // Close the current connection and reopen with incremented version
        db.close();
        dbInstance = null;
        initPromise = null;

        // Reopen with a higher version to trigger onupgradeneeded
        const newVersion = (db.version || DB_VERSION) + 1;
        const retryRequest = window.indexedDB.open(DB_NAME, newVersion);

        retryRequest.onerror = () => {
          resolve({
            success: false,
            db: null,
            error: `Failed to recreate stores: ${retryRequest.error?.message}`,
          });
        };

        retryRequest.onsuccess = () => {
          dbInstance = retryRequest.result;
          resolve({
            success: true,
            db: dbInstance,
            error: null,
          });
        };

        retryRequest.onupgradeneeded = (event) => {
          const upgradingDb = (event.target as IDBOpenDBRequest).result;
          Object.entries(storageConfig.stores).forEach(([storeName, storeConfig]) => {
            if (!upgradingDb.objectStoreNames.contains(storeName)) {
              const objectStore = upgradingDb.createObjectStore(storeName, {
                keyPath: storeConfig.keyPath,
              });
              storeConfig.indexes.forEach((index) => {
                objectStore.createIndex(index.name, index.keyPath, {
                  unique: index.unique ?? false,
                });
              });
            }
          });
        };
      } else {
        // All stores exist
        dbInstance = db;
        resolve({
          success: true,
          db: dbInstance,
          error: null,
        });
      }
    };

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      resolve({
        success: false,
        db: null,
        error: `Failed to open database: ${request.error?.message}`,
      });
    };

    request.onsuccess = () => {
      const db = request.result;
      checkAndCreateStores(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create or update object stores
      Object.entries(storageConfig.stores).forEach(([storeName, storeConfig]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          // Create new object store
          const objectStore = db.createObjectStore(storeName, {
            keyPath: storeConfig.keyPath,
          });

          // Create indexes
          storeConfig.indexes.forEach((index) => {
            objectStore.createIndex(index.name, index.keyPath, {
              unique: index.unique ?? false,
            });
          });
        }
      });
    };
  });

  return initPromise;
}

/**
 * Get the database instance
 */
export function getDB(): IDBDatabase | null {
  return dbInstance;
}

/**
 * Ensure database is initialized
 */
export async function ensureDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const result = await initDB();
  if (!result.success || !result.db) {
    throw new Error(result.error || 'Failed to initialize database');
  }

  return result.db;
}

/**
 * Clear all data from a specific object store
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear entire database
 */
export async function clearDatabase(): Promise<void> {
  const db = await ensureDB();

  return new Promise((resolve, reject) => {
    const storeNames = Array.from(db.objectStoreNames);
    const transaction = db.transaction(storeNames, 'readwrite');

    storeNames.forEach((storeName) => {
      const store = transaction.objectStore(storeName);
      store.clear();
    });

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

/**
 * Get all items from a store
 */
export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
  });
}

/**
 * Get item by key
 */
export async function getFromStore<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T | undefined);
  });
}

/**
 * Put item into store
 */
export async function putInStore<T>(storeName: string, item: T): Promise<string> {
  const db = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string);
  });
}

/**
 * Delete item from store
 */
export async function deleteFromStore(storeName: string, key: string): Promise<void> {
  const db = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Query by index
 */
export async function queryByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
  });
}
