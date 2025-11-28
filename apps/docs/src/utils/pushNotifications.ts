/**
 * Push Notifications Utility
 *
 * Handles browser push notification permissions and FCM token management.
 */

import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { app, isFirebaseConfigured } from "../services/firebase";

// VAPID key for web push (should be set in Firebase Console)
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY || "";

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
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
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
    const existingRegistration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (existingRegistration) {
      return existingRegistration;
    }

    // Register new service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
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
