// Service Worker for MyShelfControl PWA
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `myshelfcontrol-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `myshelfcontrol-images-${CACHE_VERSION}`;
const API_CACHE = `myshelfcontrol-api-${CACHE_VERSION}`;

// Core app shell routes (pre-cached for offline access)
const APP_SHELL = [
  '/',
  '/login',
  '/privacy',
  '/books',
  '/wishlist',
  '/settings',
  '/settings/library',
  '/settings/preferences',
  '/settings/maintenance',
  '/settings/bin',
  '/settings/about',
];

// Cache durations
const API_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for API responses
const IMAGE_CACHE_MAX_ITEMS = 200; // Limit cached images

// Install - cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Only cache the routes that are pre-rendered
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, IMAGE_CACHE, API_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((name) => !currentCaches.includes(name)).map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch handler with different strategies per resource type
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests except for book covers and APIs
  if (url.origin !== location.origin) {
    // Cover images - cache first, then network
    if (isCoverImage(url)) {
      event.respondWith(handleImageRequest(event.request));
      return;
    }

    // Book search APIs - network first with cache fallback
    if (isBookApi(url)) {
      event.respondWith(handleApiRequest(event.request));
      return;
    }

    // Skip Firebase SDK requests (let Firestore handle its own caching)
    if (isFirebaseRequest(url)) {
      return;
    }

    // Let other cross-origin requests pass through
    return;
  }

  // Skip Next.js development mode HMR and internal API routes
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Next.js static assets - cache first (they have hashed filenames)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticAsset(event.request));
    return;
  }

  // Page navigations - network first with app shell fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigation(event.request));
    return;
  }

  // Other same-origin requests - network first, cache fallback
  event.respondWith(handleStaticRequest(event.request));
});

// Check if URL is a cover image
function isCoverImage(url) {
  return url.hostname.includes('books.google.com') || url.hostname.includes('covers.openlibrary.org');
}

// Check if URL is a book API
function isBookApi(url) {
  return (
    (url.hostname.includes('googleapis.com') && url.pathname.includes('/books/')) ||
    (url.hostname.includes('openlibrary.org') && (url.pathname.includes('/search') || url.pathname.includes('/api/')))
  );
}

// Check if URL is Firebase-related
function isFirebaseRequest(url) {
  return (
    url.hostname.includes('firebase') || url.hostname.includes('firestore') || url.hostname.includes('gstatic.com')
  );
}

// Handle cover image requests - cache first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Return cached image immediately, refresh in background
    refreshImage(request, cache);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and cache
      cache.put(request, response.clone());
      // Trim cache if too large
      trimImageCache(cache);
    }
    return response;
  } catch {
    // Return 404 for failed image requests
    return new Response('', { status: 404 });
  }
}

// Background refresh for images
async function refreshImage(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch {
    // Ignore refresh errors
  }
}

// Limit image cache size
async function trimImageCache(cache) {
  const keys = await cache.keys();
  if (keys.length > IMAGE_CACHE_MAX_ITEMS) {
    // Delete oldest entries (first in list)
    const toDelete = keys.slice(0, keys.length - IMAGE_CACHE_MAX_ITEMS);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

// Handle API requests - network first with TTL cache
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Store with timestamp
      const responseWithTime = response.clone();
      const headers = new Headers(responseWithTime.headers);
      headers.set('sw-cache-time', Date.now().toString());

      const body = await responseWithTime.blob();
      const cachedResponse = new Response(body, {
        status: responseWithTime.status,
        statusText: responseWithTime.statusText,
        headers,
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch (err) {
    // Check cache with TTL
    const cached = await cache.match(request);
    if (cached) {
      const cacheTime = parseInt(cached.headers.get('sw-cache-time') || '0');
      const age = Date.now() - cacheTime;

      if (age < API_CACHE_DURATION) {
        return cached;
      }
    }
    throw err;
  }
}

// Handle Next.js static assets - cache first (immutable due to hashing)
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// Handle page navigations - network first with offline fallback
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful navigations
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try cached version first
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Fallback to cached root page for SPA navigation
    const rootPage = await caches.match('/');
    if (rootPage) {
      return rootPage;
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// Handle other static requests - network first, cache fallback
async function handleStaticRequest(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}
