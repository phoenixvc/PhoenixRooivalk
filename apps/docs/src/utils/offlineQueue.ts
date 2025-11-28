/**
 * Offline Queue Utility
 *
 * Provides IndexedDB-based queue for offline operations.
 * Automatically syncs when connection is restored.
 */

const DB_NAME = "phoenix-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "pending-operations";

interface QueuedOperation<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  retryCount: number;
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Generate unique ID for operations
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add operation to offline queue
 */
export async function queueOperation<T>(
  type: string,
  data: T
): Promise<string> {
  const db = await openDB();
  const id = generateId();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const operation: QueuedOperation<T> = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const request = store.add(operation);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending operations
 */
export async function getPendingOperations<T = unknown>(): Promise<
  QueuedOperation<T>[]
> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get pending operations by type
 */
export async function getPendingByType<T = unknown>(
  type: string
): Promise<QueuedOperation<T>[]> {
  const operations = await getPendingOperations<T>();
  return operations.filter((op) => op.type === type);
}

/**
 * Remove operation from queue
 */
export async function removeOperation(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update operation retry count
 */
export async function incrementRetryCount(id: string): Promise<void> {
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
}

/**
 * Clear all pending operations
 */
export async function clearQueue(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
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
  maxRetries = 3
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
  onOffline?: () => void
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
