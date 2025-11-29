/**
 * Push Notifications Utility
 *
 * Handles browser push notification permissions and FCM token management.
 */

import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { app, isFirebaseConfigured } from "../services/firebase";

// VAPID key for web push (should be set in Firebase Console)
// Accessed via Docusaurus customFields at runtime
const getVapidKey = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    // Try to get from Docusaurus context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docusaurusData = (window as any).__DOCUSAURUS__;
    const vapidKey = docusaurusData?.siteConfig?.customFields?.vapidKey;
    if (vapidKey && typeof vapidKey === "string" && vapidKey.length > 0) {
      return vapidKey;
    }
  } catch {
    // Ignore errors
  }

  // Fallback to environment variable (for non-Docusaurus builds)
  const envKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
  if (envKey && envKey.length > 0) {
    return envKey;
  }

  return null;
};

let messagingInstance: Messaging | null = null;

/**
 * Check if push notifications are supported in the browser
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isPushSupported()) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
}

/**
 * Initialize Firebase Cloud Messaging
 */
function initializeMessaging(): Messaging | null {
  if (!isFirebaseConfigured() || !app) {
    console.warn("Firebase not configured for push notifications");
    return null;
  }

  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
    } catch (error) {
      console.error("Failed to initialize Firebase Messaging:", error);
      return null;
    }
  }

  return messagingInstance;
}

/**
 * Get FCM token for push notifications
 * Requires notification permission to be granted first
 */
export async function getFCMToken(): Promise<string | null> {
  if (!isPushSupported()) {
    console.warn("Push notifications not supported");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  const vapidKey = getVapidKey();
  if (!vapidKey) {
    console.error("VAPID key not configured. Push notifications require a valid VAPID key.");
    return null;
  }

  const messaging = initializeMessaging();
  if (!messaging) {
    return null;
  }

  try {
    // Register service worker if not already registered
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error("Service worker registration failed");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

/**
 * Get Firebase config from Docusaurus context
 */
function getFirebaseConfig(): Record<string, string> | null {
  if (typeof window === "undefined") return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docusaurusData = (window as any).__DOCUSAURUS__;
    const config = docusaurusData?.siteConfig?.customFields?.firebaseConfig;
    if (config && config.apiKey && config.projectId) {
      return config;
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Send Firebase config to service worker
 */
async function sendConfigToServiceWorker(
  registration: ServiceWorkerRegistration
): Promise<void> {
  const config = getFirebaseConfig();
  if (!config) {
    console.warn("Firebase config not available for service worker");
    return;
  }

  // Wait for the service worker to be ready
  const sw = registration.active || registration.waiting || registration.installing;
  if (!sw) return;

  // Send config via postMessage
  sw.postMessage({
    type: "FIREBASE_CONFIG",
    config,
  });

  // Also cache the config for SW restart scenarios
  try {
    const cache = await caches.open("firebase-config");
    await cache.put(
      "config",
      new Response(JSON.stringify(config), {
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch {
    // Caching is optional, continue without it
  }
}

/**
 * Register the service worker for push notifications
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    // Check for existing registration
    let registration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");

    if (!registration) {
      // Register new service worker
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }

    // Wait for the service worker to be active
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration!.installing!.addEventListener("statechange", function handler() {
          if (this.state === "activated") {
            this.removeEventListener("statechange", handler);
            resolve();
          }
        });
      });
    }

    // Send Firebase config to service worker
    await sendConfigToServiceWorker(registration);

    return registration;
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}) => void): (() => void) | null {
  const messaging = initializeMessaging();
  if (!messaging) {
    return null;
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    callback({
      notification: payload.notification,
      data: payload.data,
    });
  });

  return unsubscribe;
}

/**
 * Show a local notification (for foreground messages)
 */
export function showLocalNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return;
  }

  try {
    new Notification(title, {
      icon: "/img/logo.svg",
      badge: "/img/badge.png",
      ...options,
    });
  } catch (error) {
    console.error("Error showing notification:", error);
  }
}

/**
 * Check if VAPID key is configured
 */
export function isVapidConfigured(): boolean {
  return getVapidKey() !== null;
}

/**
 * Enable push notifications with full flow:
 * 1. Request permission
 * 2. Get FCM token
 * 3. Return token for server registration
 */
export async function enablePushNotifications(): Promise<{
  success: boolean;
  token: string | null;
  permission: NotificationPermission | "unsupported";
  error?: string;
}> {
  // Check support
  if (!isPushSupported()) {
    return {
      success: false,
      token: null,
      permission: "unsupported",
      error: "Push notifications are not supported in this browser",
    };
  }

  // Check VAPID key configuration
  if (!isVapidConfigured()) {
    return {
      success: false,
      token: null,
      permission: Notification.permission,
      error: "Push notifications are not configured. Please contact support.",
    };
  }

  // Request permission
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    return {
      success: false,
      token: null,
      permission,
      error: permission === "denied"
        ? "Notification permission was denied. Please enable it in browser settings."
        : "Notification permission request was dismissed",
    };
  }

  // Get FCM token
  const token = await getFCMToken();
  if (!token) {
    return {
      success: false,
      token: null,
      permission,
      error: "Failed to get notification token. Please try again.",
    };
  }

  return {
    success: true,
    token,
    permission,
  };
}
