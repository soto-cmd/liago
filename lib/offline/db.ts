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
    tx.objectStore(OUTBOX).put(mutation);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  window.dispatchEvent(new CustomEvent("liago:offline-queue-changed"));
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

export async function removeOfflineMutation(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX, "readwrite");
    tx.objectStore(OUTBOX).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  window.dispatchEvent(new CustomEvent("liago:offline-queue-changed"));
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
  window.dispatchEvent(new CustomEvent("liago:offline-queue-changed"));
}

export async function putOfflineCache<T>(key: string, value: T) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CACHE, "readwrite");
    tx.objectStore(CACHE).put({ key, value, updatedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineCache<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE, "readonly");
    const request = tx.objectStore(CACHE).get(key);
    request.onsuccess = () => resolve((request.result?.value as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}
