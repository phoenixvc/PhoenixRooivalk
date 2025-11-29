/**
 * Offline Queue Utility
 *
 * Provides IndexedDB-based queue for offline operations.
 * Automatically syncs when connection is restored.
 * Includes fallback to localStorage when IndexedDB is unavailable.
 */

const DB_NAME = "phoenix-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "pending-operations";
const FALLBACK_KEY = "phoenix-offline-queue-fallback";

interface QueuedOperation<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  retryCount: number;
}

// Track whether we should use fallback mode
let useFallbackMode = false;

/**
 * Check if IndexedDB is available and working
 */
function isIndexedDBAvailable(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.indexedDB) return false;

  // Some browsers have indexedDB but it's blocked (e.g., private mode)
  try {
    const testKey = "__idb_test__";
    const request = indexedDB.open(testKey);
    request.onerror = () => {
      useFallbackMode = true;
    };
    // Clean up test database
    request.onsuccess = () => {
      request.result.close();
      indexedDB.deleteDatabase(testKey);
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * Get fallback storage (localStorage)
 */
function getFallbackStorage(): QueuedOperation[] {
  try {
    const data = localStorage.getItem(FALLBACK_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save to fallback storage
 */
function setFallbackStorage(operations: QueuedOperation[]): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(operations));
  } catch (error) {
    console.warn("Failed to save to localStorage fallback:", error);
  }
}

/**
 * Open IndexedDB connection with error recovery
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB || useFallbackMode) {
      reject(new Error("IndexedDB not available, using fallback"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Set a timeout for the open request
    const timeout = setTimeout(() => {
      useFallbackMode = true;
      reject(new Error("IndexedDB open timed out"));
    }, 5000);

    request.onerror = () => {
      clearTimeout(timeout);
      // If there's a version error, try to delete and recreate
      if (request.error?.name === "VersionError") {
        console.warn("IndexedDB version error, attempting recovery...");
        indexedDB.deleteDatabase(DB_NAME);
        // Retry once after deletion
        const retryRequest = indexedDB.open(DB_NAME, DB_VERSION);
        retryRequest.onsuccess = () => resolve(retryRequest.result);
        retryRequest.onerror = () => {
          useFallbackMode = true;
          reject(retryRequest.error);
        };
        retryRequest.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id" });
          }
        };
      } else {
        useFallbackMode = true;
        reject(request.error);
      }
    };

    request.onsuccess = () => {
      clearTimeout(timeout);
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    // Handle blocked (another tab has the database open with older version)
    request.onblocked = () => {
      console.warn("IndexedDB blocked by another tab");
      clearTimeout(timeout);
      useFallbackMode = true;
      reject(new Error("IndexedDB blocked"));
    };
  });
}

// Initialize on module load
if (typeof window !== "undefined") {
  isIndexedDBAvailable();
}

/**
 * Generate unique ID for operations
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Add operation to offline queue
 */
export async function queueOperation<T>(
  type: string,
  data: T,
): Promise<string> {
  const id = generateId();
  const operation: QueuedOperation<T> = {
    id,
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  };

  // Try IndexedDB first
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const request = store.add(operation);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback to localStorage
    const operations = getFallbackStorage();
    operations.push(operation as QueuedOperation);
    setFallbackStorage(operations);
    return id;
  }
}

/**
 * Get all pending operations
 */
export async function getPendingOperations<T = unknown>(): Promise<
  QueuedOperation<T>[]
> {
  // Try IndexedDB first
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback to localStorage
    return getFallbackStorage() as QueuedOperation<T>[];
  }
}

/**
 * Get pending operations by type
 */
export async function getPendingByType<T = unknown>(
  type: string,
): Promise<QueuedOperation<T>[]> {
  const operations = await getPendingOperations<T>();
  return operations.filter((op) => op.type === type);
}

/**
 * Remove operation from queue
 */
export async function removeOperation(id: string): Promise<void> {
  // Try IndexedDB first
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback to localStorage
    const operations = getFallbackStorage();
    const filtered = operations.filter((op) => op.id !== id);
    setFallbackStorage(filtered);
  }
}

/**
 * Update operation retry count
 */
export async function incrementRetryCount(id: string): Promise<void> {
  // Try IndexedDB first
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.retryCount += 1;
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch {
    // Fallback to localStorage
    const operations = getFallbackStorage();
    const updated = operations.map((op) =>
      op.id === id ? { ...op, retryCount: op.retryCount + 1 } : op,
    );
    setFallbackStorage(updated);
  }
}

/**
 * Clear all pending operations
 */
export async function clearQueue(): Promise<void> {
  // Try IndexedDB first
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback to localStorage
    setFallbackStorage([]);
  }
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Process queued operations with a handler
 */
export async function processQueue<T>(
  type: string,
  handler: (data: T) => Promise<void>,
  maxRetries = 3,
): Promise<{ processed: number; failed: number }> {
  if (!isOnline()) {
    return { processed: 0, failed: 0 };
  }

  const operations = await getPendingByType<T>(type);
  let processed = 0;
  let failed = 0;

  for (const operation of operations) {
    if (operation.retryCount >= maxRetries) {
      // Remove failed operations that exceeded retries
      await removeOperation(operation.id);
      failed++;
      continue;
    }

    try {
      await handler(operation.data);
      await removeOperation(operation.id);
      processed++;
    } catch (error) {
      console.error(`Failed to process operation ${operation.id}:`, error);
      await incrementRetryCount(operation.id);
    }
  }

  return { processed, failed };
}

/**
 * Register online/offline event listeners
 */
export function registerNetworkListeners(
  onOnline: () => void,
  onOffline?: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("online", onOnline);
  if (onOffline) {
    window.addEventListener("offline", onOffline);
  }

  return () => {
    window.removeEventListener("online", onOnline);
    if (onOffline) {
      window.removeEventListener("offline", onOffline);
    }
  };
}
