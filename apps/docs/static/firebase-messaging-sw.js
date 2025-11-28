/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles background push notifications for the Phoenix Rooivalk documentation.
 */

/* eslint-disable no-undef */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase with config
// Note: These values should match your firebase config
firebase.initializeApp({
  apiKey: "AIzaSyExample", // Will be replaced during build
  authDomain: "phoenix-rooivalk.firebaseapp.com",
  projectId: "phoenix-rooivalk",
  storageBucket: "phoenix-rooivalk.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
});

const messaging = firebase.messaging();

// Handle background messages
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
