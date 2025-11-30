/**
 * Messaging Service Interface
 *
 * Provides abstraction for push notification operations across different cloud providers.
 * Implementations: Firebase Cloud Messaging (FCM), Azure Notification Hubs
 */

import { NotificationPayload, UnsubscribeFn } from './types';

/**
 * Notification permission status
 */
export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported';

/**
 * Push token registration result
 */
export interface PushTokenResult {
  success: boolean;
  token: string | null;
  permission: NotificationPermissionStatus;
  error?: string;
}

/**
 * Notification subscription info
 */
export interface NotificationSubscription {
  token: string;
  topics: string[];
  createdAt: Date;
  platform: 'web' | 'ios' | 'android';
}

/**
 * Incoming notification callback payload
 */
export interface IncomingNotification {
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
  };
  data?: Record<string, string>;
  isBackground: boolean;
}

/**
 * Messaging service interface
 */
export interface IMessagingService {
  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean;

  /**
   * Check if the messaging service is configured
   */
  isConfigured(): boolean;

  /**
   * Get the current notification permission status
   */
  getPermissionStatus(): NotificationPermissionStatus;

  /**
   * Request notification permission from the user
   */
  requestPermission(): Promise<NotificationPermissionStatus>;

  /**
   * Get the push notification token
   * Requires permission to be granted first
   */
  getToken(): Promise<string | null>;

  /**
   * Enable push notifications with full flow:
   * 1. Request permission
   * 2. Get token
   * 3. Return result
   */
  enablePushNotifications(): Promise<PushTokenResult>;

  /**
   * Subscribe to a topic for notifications
   * @param topic - Topic name to subscribe to
   * @param token - Push token (if not provided, uses current token)
   */
  subscribeToTopic(topic: string, token?: string): Promise<boolean>;

  /**
   * Unsubscribe from a topic
   * @param topic - Topic name to unsubscribe from
   * @param token - Push token (if not provided, uses current token)
   */
  unsubscribeFromTopic(topic: string, token?: string): Promise<boolean>;

  /**
   * Listen for foreground notifications
   * @param callback - Called when a notification is received while app is in foreground
   * @returns Unsubscribe function
   */
  onForegroundMessage(
    callback: (notification: IncomingNotification) => void
  ): UnsubscribeFn | null;

  /**
   * Show a local notification (for foreground messages)
   * @param payload - Notification content
   */
  showLocalNotification(payload: NotificationPayload): void;

  /**
   * Delete the current token (useful for logout)
   */
  deleteToken(): Promise<boolean>;

  /**
   * Get the current subscription info
   */
  getSubscription(): Promise<NotificationSubscription | null>;
}

/**
 * Check if the Notification API is supported
 */
export function isNotificationApiSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Get the current Notification permission
 */
export function getCurrentPermission(): NotificationPermissionStatus {
  if (!isNotificationApiSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}
