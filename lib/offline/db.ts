export type OfflineMutation = {
  id: string;
  organizationId: string;
  entity: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "CUSTOM";
  payload: unknown;
  createdAt: string;
  attempts: number;
  status: "PENDING" | "SYNCING" | "FAILED";
  lastError?: string;
  nextAttemptAt?: string;
  dedupeKey?: string;
};

type CacheRecord<T = unknown> = {
  key: string;
  value: T;
  organizationId?: string;
  updatedAt: string;
  expiresAt?: string;
};

const DB_NAME = "liago-offline";
const DB_VERSION = 1;
const OUTBOX = "outbox";
const CACHE = "cache";
const META = "meta";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OUTBOX)) {
        const store = db.createObjectStore(OUTBOX, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("organizationId", "organizationId", { unique: false });
      }
      if (!db.objectStoreNames.contains(CACHE)) db.createObjectStore(CACHE, { keyPath: "key" });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "key" });
    };
  });
}

function notifyQueueChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("liago:offline-queue-changed"));
}

export async function queueOfflineMutation(input: Omit<OfflineMutation, "id" | "createdAt" | "attempts" | "status">) {
  const db = await openDb();
  const mutation: OfflineMutation = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: "PENDING",
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX, "readwrite");
    const store = tx.objectStore(OUTBOX);
    if (mutation.dedupeKey) {
      const request = store.getAll();
      request.onsuccess = () => {
        const existing = (request.result as OfflineMutation[]).find((item) => item.dedupeKey === mutation.dedupeKey && item.status !== "SYNCING");
        if (existing) store.put({ ...existing, ...mutation, id: existing.id, createdAt: existing.createdAt });
        else store.put(mutation);
      };
    } else {
      store.put(mutation);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  notifyQueueChanged();
  return mutation;
}

export async function listOfflineMutations(): Promise<OfflineMutation[]> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX, "readonly");
    const request = tx.objectStore(OUTBOX).getAll();
    request.onsuccess = () => resolve((request.result as OfflineMutation[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    request.onerror = () => reject(request.error);
  });
}

export async function listReadyOfflineMutations(now = new Date()): Promise<OfflineMutation[]> {
  const items = await listOfflineMutations();
  return items.filter((item) => {
    if (item.status === "SYNCING") return false;
    if (!item.nextAttemptAt) return true;
    return new Date(item.nextAttemptAt).getTime() <= now.getTime();
  });
}

export async function countOfflineMutations(): Promise<number> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX, "readonly");
    const request = tx.objectStore(OUTBOX).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeOfflineMutation(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX, "readwrite");
    tx.objectStore(OUTBOX).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  notifyQueueChanged();
}

export async function updateOfflineMutation(id: string, changes: Partial<OfflineMutation>) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX, "readwrite");
    const store = tx.objectStore(OUTBOX);
    const request = store.get(id);
    request.onsuccess = () => {
      if (!request.result) return;
      store.put({ ...request.result, ...changes });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  notifyQueueChanged();
}

export async function markOfflineMutationFailed(id: string, error: string) {
  const items = await listOfflineMutations();
  const current = items.find((item) => item.id === id);
  if (!current) return;
  const attempts = current.attempts + 1;
  const delayMs = Math.min(30 * 60 * 1000, 5_000 * 2 ** Math.min(attempts - 1, 8));
  await updateOfflineMutation(id, {
    status: "FAILED",
    attempts,
    lastError: error.slice(0, 300),
    nextAttemptAt: new Date(Date.now() + delayMs).toISOString(),
  });
}

export async function putOfflineCache<T>(key: string, value: T, options?: { ttlMs?: number; organizationId?: string }) {
  const db = await openDb();
  const now = Date.now();
  const record: CacheRecord<T> = {
    key,
    value,
    organizationId: options?.organizationId,
    updatedAt: new Date(now).toISOString(),
    expiresAt: options?.ttlMs ? new Date(now + options.ttlMs).toISOString() : undefined,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CACHE, "readwrite");
    tx.objectStore(CACHE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineCache<T>(key: string, options?: { allowExpired?: boolean; maxAgeMs?: number }): Promise<T | null> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE, "readonly");
    const request = tx.objectStore(CACHE).get(key);
    request.onsuccess = () => {
      const record = request.result as CacheRecord<T> | undefined;
      if (!record) return resolve(null);
      const now = Date.now();
      const expiredByTtl = record.expiresAt ? new Date(record.expiresAt).getTime() < now : false;
      const expiredByAge = options?.maxAgeMs ? new Date(record.updatedAt).getTime() + options.maxAgeMs < now : false;
      if (!options?.allowExpired && (expiredByTtl || expiredByAge)) return resolve(null);
      resolve(record.value);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearOfflineCacheForOrganization(organizationId: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CACHE, "readwrite");
    const store = tx.objectStore(CACHE);
    const request = store.getAll();
    request.onsuccess = () => {
      for (const record of request.result as CacheRecord[]) {
        if (record.organizationId === organizationId) store.delete(record.key);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function pruneExpiredOfflineCache() {
  const db = await openDb();
  const now = Date.now();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CACHE, "readwrite");
    const store = tx.objectStore(CACHE);
    const request = store.getAll();
    request.onsuccess = () => {
      for (const record of request.result as CacheRecord[]) {
        if (record.expiresAt && new Date(record.expiresAt).getTime() < now) store.delete(record.key);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
