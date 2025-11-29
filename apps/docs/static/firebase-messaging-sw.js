/**
 * Firebase Cloud Messaging & Offline Articles Service Worker
 *
 * Handles:
 * - Background push notifications for Phoenix Rooivalk documentation
 * - Offline article caching for saved articles
 * - Background sync for offline operations
 *
 * Configuration is received from the main thread via postMessage to avoid
 * hardcoding sensitive values in the service worker file.
 */

/* eslint-disable no-undef */

// Cache names
const ARTICLE_CACHE = "phoenix-articles-v1";
const STATIC_CACHE = "phoenix-static-v1";
const OFFLINE_SYNC_TAG = "phoenix-offline-sync";

// Import Firebase scripts
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

// Firebase instance - initialized when config is received
let messaging = null;
let isInitialized = false;

/**
 * Initialize Firebase with provided config
 * @param {Object} config - Firebase configuration object
 */
function initializeFirebase(config) {
  if (isInitialized) return;

  // Validate required config fields
  if (!config || !config.apiKey || !config.projectId) {
    console.warn("[firebase-messaging-sw.js] Invalid Firebase config received");
    return;
  }

  try {
    firebase.initializeApp(config);
    messaging = firebase.messaging();
    isInitialized = true;
    console.log("[firebase-messaging-sw.js] Firebase initialized successfully");

    // Set up background message handler after initialization
    setupBackgroundMessageHandler();
  } catch (error) {
    console.error(
      "[firebase-messaging-sw.js] Failed to initialize Firebase:",
      error,
    );
  }
}

// Listen for messages from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    initializeFirebase(event.data.config);
  }

  // Handle article caching requests
  if (event.data && event.data.type === "CACHE_ARTICLE") {
    event.waitUntil(cacheArticle(event.data.article));
  }

  // Handle article uncaching requests
  if (event.data && event.data.type === "UNCACHE_ARTICLE") {
    event.waitUntil(uncacheArticle(event.data.articleId));
  }

  // Handle get cached articles request
  if (event.data && event.data.type === "GET_CACHED_ARTICLES") {
    event.waitUntil(
      getCachedArticles().then((articles) => {
        event.ports[0].postMessage({ articles });
      }),
    );
  }
});

/**
 * Cache an article for offline reading
 * @param {Object} article - Article data to cache
 */
async function cacheArticle(article) {
  if (!article || !article.id) return;

  try {
    const cache = await caches.open(ARTICLE_CACHE);

    // Store article metadata
    const metadataKey = `/offline/articles/${article.id}/metadata`;
    await cache.put(
      metadataKey,
      new Response(JSON.stringify(article), {
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Cache the article URL if it has one
    if (article.url) {
      try {
        const response = await fetch(article.url);
        if (response.ok) {
          await cache.put(article.url, response.clone());
        }
      } catch (fetchError) {
        console.warn("[SW] Could not fetch article URL:", fetchError);
      }
    }

    // Cache any images in the article
    if (article.imageUrl) {
      try {
        const imgResponse = await fetch(article.imageUrl);
        if (imgResponse.ok) {
          await cache.put(article.imageUrl, imgResponse.clone());
        }
      } catch (imgError) {
        console.warn("[SW] Could not cache article image:", imgError);
      }
    }

    console.log("[SW] Article cached:", article.id);

    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "ARTICLE_CACHED",
        articleId: article.id,
      });
    });
  } catch (error) {
    console.error("[SW] Failed to cache article:", error);
  }
}

/**
 * Remove an article from the offline cache
 * @param {string} articleId - ID of article to remove
 */
async function uncacheArticle(articleId) {
  if (!articleId) return;

  try {
    const cache = await caches.open(ARTICLE_CACHE);

    // Get metadata to find associated URLs
    const metadataKey = `/offline/articles/${articleId}/metadata`;
    const metadataResponse = await cache.match(metadataKey);

    if (metadataResponse) {
      const article = await metadataResponse.json();

      // Remove associated cached URLs
      if (article.url) {
        await cache.delete(article.url);
      }
      if (article.imageUrl) {
        await cache.delete(article.imageUrl);
      }
    }

    // Remove metadata
    await cache.delete(metadataKey);

    console.log("[SW] Article uncached:", articleId);

    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "ARTICLE_UNCACHED",
        articleId,
      });
    });
  } catch (error) {
    console.error("[SW] Failed to uncache article:", error);
  }
}

/**
 * Get all cached articles
 * @returns {Promise<Array>} Array of cached article metadata
 */
async function getCachedArticles() {
  try {
    const cache = await caches.open(ARTICLE_CACHE);
    const keys = await cache.keys();

    const articles = [];
    for (const request of keys) {
      if (
        request.url.includes("/offline/articles/") &&
        request.url.includes("/metadata")
      ) {
        const response = await cache.match(request);
        if (response) {
          const article = await response.json();
          articles.push(article);
        }
      }
    }

    return articles;
  } catch (error) {
    console.error("[SW] Failed to get cached articles:", error);
    return [];
  }
}

// Try to get config from cache on SW activation (for refresh scenarios)
self.addEventListener("activate", async (event) => {
  event.waitUntil(
    caches.open("firebase-config").then(async (cache) => {
      try {
        const response = await cache.match("config");
        if (response) {
          const config = await response.json();
          initializeFirebase(config);
        }
      } catch (error) {
        // Config not in cache yet, will be sent via postMessage
      }
    }),
  );
});

/**
 * Set up background message handler
 */
function setupBackgroundMessageHandler() {
  if (!messaging) return;

  messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Background message:", payload);

    const notificationTitle =
      payload.notification?.title || "Phoenix Rooivalk News";
    const notificationOptions = {
      body: payload.notification?.body || "You have a new notification",
      icon: "/img/logo.svg",
      badge: "/img/badge.png",
      tag: payload.data?.articleId
        ? `news-${payload.data.articleId}`
        : "news-general",
      data: payload.data,
      requireInteraction: true,
      actions: [
        {
          action: "view",
          title: "View Article",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event);

  event.notification.close();

  const clickAction = event.action;
  const notificationData = event.notification.data;

  if (clickAction === "dismiss") {
    return;
  }

  // Default: open the article or news page
  let urlToOpen = "/news";

  if (notificationData?.articleId) {
    urlToOpen = `/news?article=${notificationData.articleId}`;
  } else if (notificationData?.clickAction) {
    urlToOpen = notificationData.clickAction;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Handle push subscription change
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("[firebase-messaging-sw.js] Push subscription changed");

  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log(
          "[firebase-messaging-sw.js] New subscription:",
          subscription,
        );
        // Here you would send the new subscription to your server
      }),
  );
});

// Fetch handler for offline articles
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only intercept GET requests
  if (event.request.method !== "GET") return;

  // Check if this is a request for cached content
  if (url.pathname.startsWith("/news") || url.pathname.startsWith("/docs/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response and update in background
          event.waitUntil(
            fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  caches.open(ARTICLE_CACHE).then((cache) => {
                    cache.put(event.request, networkResponse);
                  });
                }
              })
              .catch(() => {
                // Network unavailable, cached version already returned
              }),
          );
          return cachedResponse;
        }

        // No cache, try network
        return fetch(event.request).catch(() => {
          // If offline and no cache, return offline page
          return caches.match("/offline.html");
        });
      }),
    );
  }
});

// Background sync handler
self.addEventListener("sync", (event) => {
  if (event.tag === OFFLINE_SYNC_TAG) {
    event.waitUntil(syncOfflineOperations());
  }
});

/**
 * Sync offline operations when back online
 */
async function syncOfflineOperations() {
  console.log("[SW] Starting offline sync...");

  try {
    // Get pending operations from IndexedDB or notify main thread
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_OFFLINE_OPERATIONS",
      });
    });
  } catch (error) {
    console.error("[SW] Offline sync failed:", error);
  }
}

// Install handler - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache
        .addAll(["/offline.html", "/img/logo.svg", "/img/badge.png"])
        .catch((error) => {
          console.warn("[SW] Some static assets failed to cache:", error);
        });
    }),
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Cleanup old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Remove old versioned caches
            return (
              (name.startsWith("phoenix-articles-") &&
                name !== ARTICLE_CACHE) ||
              (name.startsWith("phoenix-static-") && name !== STATIC_CACHE)
            );
          })
          .map((name) => caches.delete(name)),
      );
    }),
  );
  // Take control of all clients immediately
  self.clients.claim();
});
