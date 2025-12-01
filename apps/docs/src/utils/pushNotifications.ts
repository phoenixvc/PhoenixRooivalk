/**
 * Push Notifications Utility
 *
 * Handles browser push notification permissions and token management.
 * Uses Azure cloud messaging service for push notification delivery.
 */

import { getMessagingService, isCloudConfigured } from "../services/cloud";

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
export function getNotificationPermission():
  | NotificationPermission
  | "unsupported" {
  if (!isPushSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
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
 * Get push notification token
 * Requires notification permission to be granted first
 */
export async function getPushToken(): Promise<string | null> {
  if (!isPushSupported()) {
    console.warn("Push notifications not supported");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  if (!isCloudConfigured()) {
    console.warn("Cloud services not configured for push notifications");
    return null;
  }

  try {
    const messaging = getMessagingService();
    const token = await messaging.getToken();
    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

// Legacy alias for backward compatibility
export const getFCMToken = getPushToken;

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(
  callback: (payload: {
    notification?: {
      title?: string;
      body?: string;
    };
    data?: Record<string, string>;
  }) => void,
): (() => void) | null {
  if (!isCloudConfigured()) {
    return null;
  }

  try {
    const messaging = getMessagingService();
    return messaging.onForegroundMessage((notification) => {
      callback({
        notification: notification.notification,
        data: notification.data,
      });
    });
  } catch (error) {
    console.error("Error setting up message listener:", error);
    return null;
  }
}

/**
 * Show a local notification (for foreground messages)
 */
export function showLocalNotification(
  title: string,
  options?: NotificationOptions,
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
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return isCloudConfigured();
}

// Legacy alias
export const isVapidConfigured = isPushConfigured;

/**
 * Enable push notifications with full flow:
 * 1. Request permission
 * 2. Get push token
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

  // Check configuration
  if (!isPushConfigured()) {
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
      error:
        permission === "denied"
          ? "Notification permission was denied. Please enable it in browser settings."
          : "Notification permission request was dismissed",
    };
  }

  // Get push token
  const token = await getPushToken();
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
