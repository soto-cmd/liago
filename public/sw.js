const VERSION = "v2";
const STATIC_CACHE = `liago-static-${VERSION}`;
const PUBLIC_PAGE_CACHE = `liago-public-pages-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = ["/", OFFLINE_URL, "/manifest.webmanifest"];
const MAX_STATIC_ENTRIES = 120;
const MAX_PAGE_ENTRIES = 20;

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

function canCacheResponse(response) {
  if (!response || !response.ok || response.type === "opaque") return false;
  const control = (response.headers.get("cache-control") || "").toLowerCase();
  return !control.includes("no-store") && !control.includes("private");
}

function isPrivatePath(pathname) {
  return pathname.startsWith("/app") || pathname.startsWith("/admin") || pathname.startsWith("/invite") || pathname.startsWith("/auth/callback");
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => ![STATIC_CACHE, PUBLIC_PAGE_CACHE].includes(key)).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (!isPrivatePath(url.pathname) && canCacheResponse(response)) {
          const cache = await caches.open(PUBLIC_PAGE_CACHE);
          await cache.put(request, response.clone());
          trimCache(PUBLIC_PAGE_CACHE, MAX_PAGE_ENTRIES);
        }
        return response;
      } catch {
        if (!isPrivatePath(url.pathname)) {
          const cached = await caches.match(request);
          if (cached) return cached;
        }
        return (await caches.match(OFFLINE_URL)) || Response.error();
      }
    })());
    return;
  }

  const isHashedAsset = url.pathname.startsWith("/_next/static/");
  const isStaticAsset = isHashedAsset || ["style", "script", "image", "font"].includes(request.destination);

  if (isStaticAsset) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (canCacheResponse(response)) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put(request, response.clone());
          trimCache(STATIC_CACHE, MAX_STATIC_ENTRIES);
        }
        return response;
      } catch {
        return cached || Response.error();
      }
    })());
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "LIAGO_CLEAR_PRIVATE_CACHE") {
    event.waitUntil(caches.delete(PUBLIC_PAGE_CACHE));
  }
});
