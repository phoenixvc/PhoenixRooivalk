/**
 * Push Notification Service
 *
 * Provides push notification capabilities using Azure Notification Hubs.
 *
 * Environment Variables:
 * - AZURE_NOTIFICATION_HUB_CONNECTION_STRING: Hub connection string
 * - AZURE_NOTIFICATION_HUB_NAME: Hub name
 */

import { createLogger, Logger } from "./logger";

/**
 * Escape XML special characters to prevent XML injection
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;");
}

const logger: Logger = createLogger({ feature: "push-notifications" });

/**
 * Push notification message
 */
export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
  icon?: string;
}

/**
 * Push notification result
 */
export interface PushResult {
  success: boolean;
  trackingId?: string;
  error?: string;
}

/**
 * Device registration
 */
export interface DeviceRegistration {
  platform: "fcm" | "apns" | "wns"; // Firebase, Apple, Windows
  pushToken: string;
  tags?: string[];
  userId?: string;
}

/**
 * Get Notification Hub configuration
 */
function getHubConfig(): {
  connectionString: string;
  hubName: string;
} | null {
  const connectionString = process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING;
  const hubName = process.env.AZURE_NOTIFICATION_HUB_NAME;

  if (!connectionString || !hubName) {
    return null;
  }

  return { connectionString, hubName };
}

/**
 * Parse connection string to extract endpoint and credentials
 */
function parseConnectionString(connectionString: string): {
  endpoint: string;
  sharedAccessKeyName: string;
  sharedAccessKey: string;
} | null {
  const endpointMatch = connectionString.match(/Endpoint=sb:\/\/([^/]+)\//i);
  const keyNameMatch = connectionString.match(/SharedAccessKeyName=([^;]+)/i);
  const keyMatch = connectionString.match(/SharedAccessKey=([^;]+)/i);

  if (!endpointMatch || !keyNameMatch || !keyMatch) {
    return null;
  }

  return {
    endpoint: endpointMatch[1],
    sharedAccessKeyName: keyNameMatch[1],
    sharedAccessKey: keyMatch[1],
  };
}

/**
 * Generate SAS token for Azure Notification Hubs
 */
async function generateSasToken(
  resourceUri: string,
  keyName: string,
  key: string,
  expiresInMins: number = 60,
): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + expiresInMins * 60;
  const encodedUri = encodeURIComponent(resourceUri);
  const stringToSign = `${encodedUri}\n${expiry}`;

  // Compute HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(stringToSign);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const encodedSignature = encodeURIComponent(
    btoa(String.fromCharCode(...new Uint8Array(signature))),
  );

  return `SharedAccessSignature sr=${encodedUri}&sig=${encodedSignature}&se=${expiry}&skn=${keyName}`;
}

/**
 * Send push notification to a specific device
 */
export async function sendPushNotification(
  pushToken: string,
  platform: "fcm" | "apns" | "wns",
  notification: PushNotification,
): Promise<PushResult> {
  const config = getHubConfig();

  if (!config) {
    logger.warn("Push notifications not configured");
    return { success: false, error: "Push notifications not configured" };
  }

  const parsed = parseConnectionString(config.connectionString);
  if (!parsed) {
    return { success: false, error: "Invalid connection string" };
  }

  const resourceUri = `https://${parsed.endpoint}/${config.hubName}`;
  const sasToken = await generateSasToken(
    resourceUri,
    parsed.sharedAccessKeyName,
    parsed.sharedAccessKey,
  );

  // Build platform-specific payload
  let payload: string;
  let contentType: string;
  let platformHeader: string;

  switch (platform) {
    case "fcm":
      platformHeader = "gcm";
      contentType = "application/json";
      payload = JSON.stringify({
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
        },
        data: notification.data || {},
      });
      break;

    case "apns":
      platformHeader = "apple";
      contentType = "application/json";
      payload = JSON.stringify({
        aps: {
          alert: {
            title: notification.title,
            body: notification.body,
          },
          badge: notification.badge,
          sound: notification.sound || "default",
        },
        ...notification.data,
      });
      break;

    case "wns":
      platformHeader = "wns";
      contentType = "application/xml";
      payload = `
        <toast>
          <visual>
            <binding template="ToastText02">
              <text id="1">${escapeXml(notification.title)}</text>
              <text id="2">${escapeXml(notification.body)}</text>
            </binding>
          </visual>
        </toast>
      `;
      break;
  }

  try {
    const url = `${resourceUri}/messages/?api-version=2020-06`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: sasToken,
        "Content-Type": contentType,
        "ServiceBusNotification-Format": platformHeader,
        "ServiceBusNotification-DeviceHandle": pushToken,
      },
      body: payload,
    });

    if (response.ok || response.status === 201) {
      const trackingId = response.headers.get("TrackingId") || undefined;
      logger.info("Push notification sent", { platform, trackingId });
      return { success: true, trackingId };
    }

    const errorText = await response.text();
    logger.error("Failed to send push notification", {
      status: response.status,
      error: errorText,
    });
    return { success: false, error: `HTTP ${response.status}: ${errorText}` };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Push notification error", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Send push notification to all devices with a tag
 */
export async function sendTaggedNotification(
  tag: string,
  notification: PushNotification,
): Promise<PushResult> {
  const config = getHubConfig();

  if (!config) {
    logger.warn("Push notifications not configured");
    return { success: false, error: "Push notifications not configured" };
  }

  const parsed = parseConnectionString(config.connectionString);
  if (!parsed) {
    return { success: false, error: "Invalid connection string" };
  }

  const resourceUri = `https://${parsed.endpoint}/${config.hubName}`;
  const sasToken = await generateSasToken(
    resourceUri,
    parsed.sharedAccessKeyName,
    parsed.sharedAccessKey,
  );

  // Send as template notification (cross-platform)
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    ...notification.data,
  });

  try {
    const url = `${resourceUri}/messages/?api-version=2020-06`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: sasToken,
        "Content-Type": "application/json",
        "ServiceBusNotification-Format": "template",
        "ServiceBusNotification-Tags": tag,
      },
      body: payload,
    });

    if (response.ok || response.status === 201) {
      const trackingId = response.headers.get("TrackingId") || undefined;
      logger.info("Tagged notification sent", { tag, trackingId });
      return { success: true, trackingId };
    }

    const errorText = await response.text();
    logger.error("Failed to send tagged notification", {
      status: response.status,
      error: errorText,
    });
    return { success: false, error: `HTTP ${response.status}: ${errorText}` };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Tagged notification error", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Register a device for push notifications
 */
export async function registerDevice(
  registration: DeviceRegistration,
): Promise<{ registrationId: string } | null> {
  const config = getHubConfig();

  if (!config) {
    logger.warn("Push notifications not configured");
    return null;
  }

  const parsed = parseConnectionString(config.connectionString);
  if (!parsed) {
    return null;
  }

  const resourceUri = `https://${parsed.endpoint}/${config.hubName}`;
  const sasToken = await generateSasToken(
    resourceUri,
    parsed.sharedAccessKeyName,
    parsed.sharedAccessKey,
  );

  // Create registration based on platform
  let registrationXml: string;

  const tags = registration.tags || [];
  if (registration.userId) {
    tags.push(`user:${registration.userId}`);
  }
  const tagsXml = tags.length > 0 ? `<Tags>${tags.join(",")}</Tags>` : "";

  switch (registration.platform) {
    case "fcm":
      registrationXml = `<?xml version="1.0" encoding="utf-8"?>
        <entry xmlns="http://www.w3.org/2005/Atom">
          <content type="application/xml">
            <GcmRegistrationDescription xmlns="http://schemas.microsoft.com/netservices/2010/10/servicebus/connect">
              <GcmRegistrationId>${registration.pushToken}</GcmRegistrationId>
              ${tagsXml}
            </GcmRegistrationDescription>
          </content>
        </entry>`;
      break;

    case "apns":
      registrationXml = `<?xml version="1.0" encoding="utf-8"?>
        <entry xmlns="http://www.w3.org/2005/Atom">
          <content type="application/xml">
            <AppleRegistrationDescription xmlns="http://schemas.microsoft.com/netservices/2010/10/servicebus/connect">
              <DeviceToken>${registration.pushToken}</DeviceToken>
              ${tagsXml}
            </AppleRegistrationDescription>
          </content>
        </entry>`;
      break;

    case "wns":
      registrationXml = `<?xml version="1.0" encoding="utf-8"?>
        <entry xmlns="http://www.w3.org/2005/Atom">
          <content type="application/xml">
            <WindowsRegistrationDescription xmlns="http://schemas.microsoft.com/netservices/2010/10/servicebus/connect">
              <ChannelUri>${registration.pushToken}</ChannelUri>
              ${tagsXml}
            </WindowsRegistrationDescription>
          </content>
        </entry>`;
      break;
  }

  try {
    const url = `${resourceUri}/registrations/?api-version=2020-06`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: sasToken,
        "Content-Type": "application/atom+xml;type=entry;charset=utf-8",
      },
      body: registrationXml,
    });

    if (response.ok || response.status === 201) {
      // Parse registration ID from response
      const responseText = await response.text();
      const regIdMatch = responseText.match(
        /<RegistrationId>([^<]+)<\/RegistrationId>/,
      );
      const registrationId = regIdMatch ? regIdMatch[1] : "unknown";

      logger.info("Device registered", {
        platform: registration.platform,
        registrationId,
      });
      return { registrationId };
    }

    const errorText = await response.text();
    logger.error("Failed to register device", {
      status: response.status,
      error: errorText,
    });
    return null;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Device registration error", { error: errorMessage });
    return null;
  }
}

/**
 * Unregister a device
 */
export async function unregisterDevice(
  registrationId: string,
): Promise<boolean> {
  const config = getHubConfig();

  if (!config) {
    return false;
  }

  const parsed = parseConnectionString(config.connectionString);
  if (!parsed) {
    return false;
  }

  const resourceUri = `https://${parsed.endpoint}/${config.hubName}`;
  const sasToken = await generateSasToken(
    resourceUri,
    parsed.sharedAccessKeyName,
    parsed.sharedAccessKey,
  );

  try {
    const url = `${resourceUri}/registrations/${registrationId}?api-version=2020-06`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: sasToken,
        "If-Match": "*",
      },
    });

    if (response.ok || response.status === 200 || response.status === 404) {
      logger.info("Device unregistered", { registrationId });
      return true;
    }

    logger.error("Failed to unregister device", { status: response.status });
    return false;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Device unregistration error", { error: errorMessage });
    return false;
  }
}
