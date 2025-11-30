/**
 * Azure Messaging Service Implementation
 *
 * Implements IMessagingService using Azure Notification Hubs.
 *
 * Note: Azure Notification Hubs requires backend integration.
 * This implementation uses Azure Functions as a proxy for registration.
 */

import {
  IMessagingService,
  NotificationPermissionStatus,
  PushTokenResult,
  NotificationSubscription,
  IncomingNotification,
  isNotificationApiSupported,
  getCurrentPermission,
} from '../interfaces/messaging';
import { NotificationPayload, UnsubscribeFn } from '../interfaces/types';

/**
 * Azure Notification Hub Configuration
 */
export interface AzureMessagingConfig {
  functionsBaseUrl: string;
  hubName?: string;
}

/**
 * Azure Notification Hubs Service
 */
export class AzureMessagingService implements IMessagingService {
  private config: AzureMessagingConfig | null = null;
  private currentToken: string | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(config?: AzureMessagingConfig) {
    this.config = config || null;
  }

  isSupported(): boolean {
    return isNotificationApiSupported();
  }

  isConfigured(): boolean {
    return this.config !== null && Boolean(this.config.functionsBaseUrl);
  }

  getPermissionStatus(): NotificationPermissionStatus {
    return getCurrentPermission();
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermissionStatus;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.isSupported() || !this.isConfigured()) {
      return null;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      // Register service worker if not already registered
      this.serviceWorkerRegistration = await this.registerServiceWorker();
      if (!this.serviceWorkerRegistration) {
        console.error('Service worker registration failed');
        return null;
      }

      // Get push subscription from service worker
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await this.getVapidPublicKey(),
      });

      // Convert subscription to token string
      this.currentToken = JSON.stringify(subscription.toJSON());

      // Register with Azure Notification Hub via Functions
      await this.registerWithHub(this.currentToken);

      return this.currentToken;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async enablePushNotifications(): Promise<PushTokenResult> {
    // Check support
    if (!this.isSupported()) {
      return {
        success: false,
        token: null,
        permission: 'unsupported',
        error: 'Push notifications are not supported in this browser',
      };
    }

    // Check configuration
    if (!this.isConfigured()) {
      return {
        success: false,
        token: null,
        permission: this.getPermissionStatus(),
        error: 'Push notifications are not configured. Please contact support.',
      };
    }

    // Request permission
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        token: null,
        permission,
        error:
          permission === 'denied'
            ? 'Notification permission was denied. Please enable it in browser settings.'
            : 'Notification permission request was dismissed',
      };
    }

    // Get token
    const token = await this.getToken();
    if (!token) {
      return {
        success: false,
        token: null,
        permission,
        error: 'Failed to get notification token. Please try again.',
      };
    }

    return {
      success: true,
      token,
      permission,
    };
  }

  async subscribeToTopic(topic: string, token?: string): Promise<boolean> {
    if (!this.config?.functionsBaseUrl) return false;

    try {
      const response = await fetch(
        `${this.config.functionsBaseUrl}/api/notifications/subscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token || this.currentToken,
            topic,
          }),
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  async unsubscribeFromTopic(topic: string, token?: string): Promise<boolean> {
    if (!this.config?.functionsBaseUrl) return false;

    try {
      const response = await fetch(
        `${this.config.functionsBaseUrl}/api/notifications/unsubscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token || this.currentToken,
            topic,
          }),
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }

  onForegroundMessage(
    callback: (notification: IncomingNotification) => void
  ): UnsubscribeFn | null {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        callback({
          notification: event.data.notification,
          data: event.data.data,
          isBackground: false,
        });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }

  showLocalNotification(payload: NotificationPayload): void {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/img/logo.svg',
        badge: payload.badge || '/img/badge.png',
        data: payload.data,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async deleteToken(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) return false;

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Unregister from Azure Notification Hub
        if (this.currentToken) {
          await this.unregisterFromHub(this.currentToken);
        }
      }
      this.currentToken = null;
      return true;
    } catch (error) {
      console.error('Error deleting token:', error);
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
      topics: [], // Would need to track separately or query from backend
      createdAt: new Date(),
      platform: 'web',
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      let registration = await navigator.serviceWorker.getRegistration('/sw.js');

      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      // Wait for activation
      if (registration.installing) {
        await new Promise<void>((resolve) => {
          registration!.installing!.addEventListener('statechange', function handler() {
            if (this.state === 'activated') {
              this.removeEventListener('statechange', handler);
              resolve();
            }
          });
        });
      }

      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }

  private async getVapidPublicKey(): Promise<Uint8Array> {
    if (!this.config?.functionsBaseUrl) {
      throw new Error('Functions base URL not configured');
    }

    const response = await fetch(
      `${this.config.functionsBaseUrl}/api/notifications/vapid-key`
    );

    if (!response.ok) {
      throw new Error('Failed to get VAPID public key');
    }

    const { publicKey } = await response.json();
    return this.urlBase64ToUint8Array(publicKey);
  }

  private async registerWithHub(token: string): Promise<void> {
    if (!this.config?.functionsBaseUrl) return;

    const response = await fetch(
      `${this.config.functionsBaseUrl}/api/notifications/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: 'web',
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to register with Notification Hub');
    }
  }

  private async unregisterFromHub(token: string): Promise<void> {
    if (!this.config?.functionsBaseUrl) return;

    await fetch(`${this.config.functionsBaseUrl}/api/notifications/unregister`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
