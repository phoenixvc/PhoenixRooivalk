/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles background push notifications for the Phoenix Rooivalk documentation.
 *
 * Configuration is received from the main thread via postMessage to avoid
 * hardcoding sensitive values in the service worker file.
 */

/* eslint-disable no-undef */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

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
    console.warn('[firebase-messaging-sw.js] Invalid Firebase config received');
    return;
  }

  try {
    firebase.initializeApp(config);
    messaging = firebase.messaging();
    isInitialized = true;
    console.log('[firebase-messaging-sw.js] Firebase initialized successfully');

    // Set up background message handler after initialization
    setupBackgroundMessageHandler();
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Failed to initialize Firebase:', error);
  }
}

// Listen for config from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    initializeFirebase(event.data.config);
  }
});

// Try to get config from cache on SW activation (for refresh scenarios)
self.addEventListener('activate', async (event) => {
  event.waitUntil(
    caches.open('firebase-config').then(async (cache) => {
      try {
        const response = await cache.match('config');
        if (response) {
          const config = await response.json();
          initializeFirebase(config);
        }
      } catch (error) {
        // Config not in cache yet, will be sent via postMessage
      }
    })
  );
});

/**
 * Set up background message handler
 */
function setupBackgroundMessageHandler() {
  if (!messaging) return;

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message:', payload);

    const notificationTitle = payload.notification?.title || 'Phoenix Rooivalk News';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: '/img/logo.svg',
      badge: '/img/badge.png',
      tag: payload.data?.articleId ? `news-${payload.data.articleId}` : 'news-general',
      data: payload.data,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Article'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  const clickAction = event.action;
  const notificationData = event.notification.data;

  if (clickAction === 'dismiss') {
    return;
  }

  // Default: open the article or news page
  let urlToOpen = '/news';

  if (notificationData?.articleId) {
    urlToOpen = `/news?article=${notificationData.articleId}`;
  } else if (notificationData?.clickAction) {
    urlToOpen = notificationData.clickAction;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[firebase-messaging-sw.js] Push subscription changed');

  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log('[firebase-messaging-sw.js] New subscription:', subscription);
        // Here you would send the new subscription to your server
      })
  );
});
