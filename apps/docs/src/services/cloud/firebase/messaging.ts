/**
 * Firebase Messaging Service Implementation
 *
 * Implements IMessagingService using Firebase Cloud Messaging (FCM).
 */

import {
  getMessaging,
  getToken,
  deleteToken,
  onMessage,
  Messaging,
} from "firebase/messaging";
import { FirebaseApp } from "firebase/app";
import {
  IMessagingService,
  NotificationPermissionStatus,
  PushTokenResult,
  NotificationSubscription,
  IncomingNotification,
  isNotificationApiSupported,
  getCurrentPermission,
} from "../interfaces/messaging";
import { NotificationPayload, UnsubscribeFn } from "../interfaces/types";

/**
 * Get VAPID key from Docusaurus context or environment
 */
function getVapidKey(): string | null {
  if (typeof window === "undefined") return null;

  try {
    // Try Docusaurus context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docusaurusData = (window as any).__DOCUSAURUS__;
    const vapidKey = docusaurusData?.siteConfig?.customFields?.vapidKey;
    if (vapidKey && typeof vapidKey === "string" && vapidKey.length > 0) {
      return vapidKey;
    }
  } catch {
    // Ignore
  }

  // Fallback to environment variable
  const envKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
  if (envKey && envKey.length > 0) {
    return envKey;
  }

  return null;
}

/**
 * Firebase Messaging Service
 */
export class FirebaseMessagingService implements IMessagingService {
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;

  constructor(private app: FirebaseApp | null) {}

  isSupported(): boolean {
    return isNotificationApiSupported();
  }

  isConfigured(): boolean {
    return this.app !== null && getVapidKey() !== null;
  }

  getPermissionStatus(): NotificationPermissionStatus {
    return getCurrentPermission();
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return "unsupported";
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermissionStatus;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.isSupported() || !this.isConfigured()) {
      return null;
    }

    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    const vapidKey = getVapidKey();
    if (!vapidKey) {
      console.error("VAPID key not configured");
      return null;
    }

    try {
      // Initialize messaging if needed
      if (!this.messaging && this.app) {
        this.messaging = getMessaging(this.app);
      }

      if (!this.messaging) return null;

      // Register service worker
      const registration = await this.registerServiceWorker();
      if (!registration) {
        console.error("Service worker registration failed");
        return null;
      }

      // Get token
      const token = await getToken(this.messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      this.currentToken = token || null;
      return this.currentToken;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }

  async enablePushNotifications(): Promise<PushTokenResult> {
    // Check support
    if (!this.isSupported()) {
      return {
        success: false,
        token: null,
        permission: "unsupported",
        error: "Push notifications are not supported in this browser",
      };
    }

    // Check configuration
    if (!this.isConfigured()) {
      return {
        success: false,
        token: null,
        permission: this.getPermissionStatus(),
        error: "Push notifications are not configured. Please contact support.",
      };
    }

    // Request permission
    const permission = await this.requestPermission();
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

    // Get token
    const token = await this.getToken();
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

  async subscribeToTopic(topic: string, token?: string): Promise<boolean> {
    // FCM topic subscription requires a backend call
    // This would typically be handled by a Cloud Function
    console.warn("FCM topic subscription requires backend implementation");
    return false;
  }

  async unsubscribeFromTopic(topic: string, token?: string): Promise<boolean> {
    // FCM topic unsubscription requires a backend call
    console.warn("FCM topic unsubscription requires backend implementation");
    return false;
  }

  onForegroundMessage(
    callback: (notification: IncomingNotification) => void,
  ): UnsubscribeFn | null {
    if (!this.messaging) {
      if (this.app) {
        try {
          this.messaging = getMessaging(this.app);
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }

    return onMessage(this.messaging, (payload) => {
      callback({
        notification: payload.notification,
        data: payload.data,
        isBackground: false,
      });
    });
  }

  showLocalNotification(payload: NotificationPayload): void {
    if (!this.isSupported() || Notification.permission !== "granted") {
      return;
    }

    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || "/img/logo.svg",
        badge: payload.badge || "/img/badge.png",
        data: payload.data,
      });
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }

  async deleteToken(): Promise<boolean> {
    if (!this.messaging) return false;

    try {
      await deleteToken(this.messaging);
      this.currentToken = null;
      return true;
    } catch (error) {
      console.error("Error deleting token:", error);
      return false;
    }
  }

  async getSubscription(): Promise<NotificationSubscription | null> {
    if (!this.currentToken) {
      const token = await this.getToken();
      if (!token) return null;
    }

    return {
      token: this.currentToken!,
      topics: [], // Would need backend to track
      createdAt: new Date(),
      platform: "web",
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!("serviceWorker" in navigator)) {
      return null;
    }

    try {
      let registration = await navigator.serviceWorker.getRegistration(
        "/firebase-messaging-sw.js",
      );

      if (!registration) {
        registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );
      }

      // Wait for activation
      if (registration.installing) {
        await new Promise<void>((resolve) => {
          registration!.installing!.addEventListener(
            "statechange",
            function handler() {
              if (this.state === "activated") {
                this.removeEventListener("statechange", handler);
                resolve();
              }
            },
          );
        });
      }

      // Send Firebase config to service worker
      await this.sendConfigToServiceWorker(registration);

      return registration;
    } catch (error) {
      console.error("Service worker registration failed:", error);
      return null;
    }
  }

  private async sendConfigToServiceWorker(
    registration: ServiceWorkerRegistration,
  ): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docusaurusData = (window as any).__DOCUSAURUS__;
      const config = docusaurusData?.siteConfig?.customFields?.firebaseConfig;

      if (!config) return;

      const sw =
        registration.active || registration.waiting || registration.installing;
      if (!sw) return;

      sw.postMessage({
        type: "FIREBASE_CONFIG",
        config,
      });

      // Cache config for SW restart
      const cache = await caches.open("firebase-config");
      await cache.put(
        "config",
        new Response(JSON.stringify(config), {
          headers: { "Content-Type": "application/json" },
        }),
      );
    } catch {
      // Caching is optional
    }
  }
}
