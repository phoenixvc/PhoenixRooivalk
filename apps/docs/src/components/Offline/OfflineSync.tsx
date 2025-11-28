/**
 * Offline Sync Service
 *
 * Queues progress updates when offline and syncs when back online.
 * Uses localStorage to persist the queue across sessions.
 */

const OFFLINE_QUEUE_KEY = "phoenix-docs-offline-queue";

export interface QueuedUpdate {
  id: string;
  timestamp: number;
  data: Record<string, unknown>;
  type: "progress" | "analytics";
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

/**
 * Get the queued updates from localStorage
 */
export function getQueuedUpdates(): QueuedUpdate[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add an update to the offline queue
 */
export function queueUpdate(
  update: Omit<QueuedUpdate, "id" | "timestamp">,
): void {
  if (typeof window === "undefined") return;

  const queue = getQueuedUpdates();
  const newUpdate: QueuedUpdate = {
    ...update,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  queue.push(newUpdate);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Remove an update from the queue after successful sync
 */
export function removeFromQueue(id: string): void {
  if (typeof window === "undefined") return;

  const queue = getQueuedUpdates().filter((item) => item.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Clear the entire queue
 */
export function clearQueue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

/**
 * Get the count of pending updates
 */
export function getPendingCount(): number {
  return getQueuedUpdates().length;
}
