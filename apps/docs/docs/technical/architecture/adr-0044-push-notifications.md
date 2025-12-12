---
id: adr-0044-push-notifications
title: "ADR 0044: Push Notifications Architecture"
sidebar_label: "ADR 0044: Push Notifications"
difficulty: intermediate
estimated_reading_time: 8
points: 35
tags:
  - technical
  - architecture
  - notifications
  - push
  - mobile
  - alerts
prerequisites:
  - architecture-decision-records
  - adr-0043-realtime-communication
---

# ADR 0044: Push Notifications Architecture

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Operators need alerts even when not actively using the application, requiring push notifications to mobile and desktop devices
2. **Decision**: Implement Azure Notification Hub for cross-platform push with priority-based delivery and offline queuing
3. **Trade-off**: Third-party service dependency vs. cross-platform simplicity

---

## Context

### Notification Requirements

| Notification Type | Priority | Delivery SLA |
|-------------------|----------|--------------|
| Engagement alert | Critical | <30 seconds |
| Threat detection | High | <1 minute |
| System status | Normal | <5 minutes |
| Daily summary | Low | Best effort |

### Target Platforms

| Platform | Push Service |
|----------|--------------|
| iOS | Apple Push Notification Service (APNs) |
| Android | Firebase Cloud Messaging (FCM) |
| Windows | Windows Push Notification Service (WNS) |
| Web | Web Push (VAPID) |

---

## Decision

Implement **Azure Notification Hub** for unified push notification delivery:

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Push Notification Architecture                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  NOTIFICATION SOURCES                                               │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Alert      │  │   Threat     │  │   System     │          ││
│  │  │   Service    │  │   Detector   │  │   Monitor    │          ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          ││
│  └─────────┼─────────────────┼─────────────────┼───────────────────┘│
│            └─────────────────┼─────────────────┘                     │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                 NOTIFICATION SERVICE                             ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Priority   │  │   Template   │  │   Routing    │          ││
│  │  │   Queue      │  │   Engine     │  │   Logic      │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │               AZURE NOTIFICATION HUB                             ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Device     │  │   Tag-based  │  │   Delivery   │          ││
│  │  │   Registry   │  │   Routing    │  │   Tracking   │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│              ┌───────────────┼───────────────┐                       │
│              ▼               ▼               ▼                       │
│        ┌─────────┐     ┌─────────┐     ┌─────────┐                 │
│        │  APNs   │     │   FCM   │     │   WNS   │                 │
│        └─────────┘     └─────────┘     └─────────┘                 │
│              │               │               │                       │
│              ▼               ▼               ▼                       │
│        ┌─────────┐     ┌─────────┐     ┌─────────┐                 │
│        │   iOS   │     │ Android │     │ Windows │                 │
│        └─────────┘     └─────────┘     └─────────┘                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Notification Model

### Notification Schema

```rust
pub struct Notification {
    pub id: Uuid,
    pub notification_type: NotificationType,
    pub priority: NotificationPriority,

    // Content
    pub title: String,
    pub body: String,
    pub data: HashMap<String, String>,

    // Targeting
    pub target: NotificationTarget,

    // Options
    pub options: NotificationOptions,

    // Metadata
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}

pub enum NotificationType {
    EngagementAlert,
    ThreatDetection,
    SystemStatus,
    DailySummary,
    Custom(String),
}

pub enum NotificationPriority {
    Critical,   // Bypass DND, vibrate
    High,       // Normal sound
    Normal,     // Silent
    Low,        // Batch delivery
}

pub enum NotificationTarget {
    /// Send to specific user
    User(UserId),
    /// Send to all users in tenant
    Tenant(TenantId),
    /// Send to users with specific role
    Role { tenant_id: TenantId, role: String },
    /// Send to specific devices
    Devices(Vec<DeviceToken>),
    /// Send to tag expression
    Tags(String),  // e.g., "operator && (node:alpha || node:bravo)"
}

pub struct NotificationOptions {
    pub sound: Option<String>,
    pub badge: Option<u32>,
    pub ttl: Duration,
    pub collapse_key: Option<String>,
    pub action_buttons: Vec<ActionButton>,
}
```

---

## Device Registration

### Registration Flow

```rust
pub struct DeviceRegistration {
    pub device_token: String,
    pub platform: Platform,
    pub user_id: UserId,
    pub tenant_id: TenantId,
    pub tags: Vec<String>,
    pub registered_at: DateTime<Utc>,
}

pub enum Platform {
    iOS,
    Android,
    Windows,
    Web,
}

impl NotificationService {
    /// Register device for push notifications
    pub async fn register_device(
        &self,
        registration: DeviceRegistration,
    ) -> Result<RegistrationId, Error> {
        // Build tags for targeting
        let mut tags = registration.tags.clone();
        tags.push(format!("user:{}", registration.user_id));
        tags.push(format!("tenant:{}", registration.tenant_id));

        // Get user roles and add as tags
        let user = self.user_service.get(&registration.user_id).await?;
        for role in &user.roles {
            tags.push(format!("role:{}", role));
        }

        // Register with Notification Hub
        let reg_id = match registration.platform {
            Platform::iOS => {
                self.hub.create_apns_registration(
                    &registration.device_token,
                    &tags,
                ).await?
            }
            Platform::Android => {
                self.hub.create_fcm_registration(
                    &registration.device_token,
                    &tags,
                ).await?
            }
            Platform::Windows => {
                self.hub.create_wns_registration(
                    &registration.device_token,
                    &tags,
                ).await?
            }
            Platform::Web => {
                self.hub.create_web_push_registration(
                    &registration.device_token,
                    &tags,
                ).await?
            }
        };

        // Store in database for management
        self.db.save_registration(&registration, &reg_id).await?;

        Ok(reg_id)
    }
}
```

---

## Notification Sending

### Send Logic

```rust
impl NotificationService {
    pub async fn send(&self, notification: Notification) -> Result<SendResult, Error> {
        // Build platform-specific payloads
        let payloads = self.build_payloads(&notification);

        // Determine tag expression for targeting
        let tag_expression = match &notification.target {
            NotificationTarget::User(user_id) => format!("user:{}", user_id),
            NotificationTarget::Tenant(tenant_id) => format!("tenant:{}", tenant_id),
            NotificationTarget::Role { tenant_id, role } => {
                format!("tenant:{} && role:{}", tenant_id, role)
            }
            NotificationTarget::Tags(expr) => expr.clone(),
            NotificationTarget::Devices(_) => {
                // Direct delivery, no tag expression
                return self.send_direct(&notification, &payloads).await;
            }
        };

        // Set priority-specific options
        let options = self.priority_options(&notification.priority);

        // Send via Notification Hub
        let result = self.hub.send_notification(
            &payloads,
            &tag_expression,
            &options,
        ).await?;

        // Track delivery
        self.track_delivery(&notification, &result).await?;

        Ok(result)
    }

    fn build_payloads(&self, notification: &Notification) -> PlatformPayloads {
        PlatformPayloads {
            apns: ApnsPayload {
                aps: ApsAlert {
                    alert: ApnsAlert {
                        title: notification.title.clone(),
                        body: notification.body.clone(),
                    },
                    sound: self.sound_for_priority(&notification.priority),
                    badge: None,
                    content_available: 1,
                    interruption_level: match notification.priority {
                        NotificationPriority::Critical => "critical",
                        NotificationPriority::High => "time-sensitive",
                        _ => "active",
                    },
                },
                custom: notification.data.clone(),
            },
            fcm: FcmPayload {
                notification: FcmNotification {
                    title: notification.title.clone(),
                    body: notification.body.clone(),
                },
                data: notification.data.clone(),
                android: FcmAndroid {
                    priority: match notification.priority {
                        NotificationPriority::Critical | NotificationPriority::High => "high",
                        _ => "normal",
                    },
                    ttl: format!("{}s", notification.options.ttl.as_secs()),
                },
            },
            wns: WnsPayload::Toast {
                visual: WnsVisual {
                    binding: WnsBinding {
                        template: "ToastGeneric",
                        text: vec![notification.title.clone(), notification.body.clone()],
                    },
                },
            },
        }
    }
}
```

---

## Priority Handling

### Critical Notifications

```rust
impl NotificationService {
    fn priority_options(&self, priority: &NotificationPriority) -> SendOptions {
        match priority {
            NotificationPriority::Critical => SendOptions {
                // iOS: Override Do Not Disturb
                apns_priority: 10,
                apns_push_type: "alert",

                // Android: High priority FCM
                fcm_priority: "high",

                // Short TTL for time-sensitive
                ttl: Duration::from_secs(60),

                // Don't collapse critical alerts
                collapse_key: None,
            },
            NotificationPriority::High => SendOptions {
                apns_priority: 10,
                apns_push_type: "alert",
                fcm_priority: "high",
                ttl: Duration::from_secs(300),
                collapse_key: Some("high_priority".into()),
            },
            NotificationPriority::Normal => SendOptions {
                apns_priority: 5,
                apns_push_type: "background",
                fcm_priority: "normal",
                ttl: Duration::from_secs(3600),
                collapse_key: Some("normal".into()),
            },
            NotificationPriority::Low => SendOptions {
                apns_priority: 1,
                apns_push_type: "background",
                fcm_priority: "normal",
                ttl: Duration::from_secs(86400),
                collapse_key: Some("daily".into()),
            },
        }
    }
}
```

---

## Azure Configuration

### Notification Hub Setup

```bicep
resource notificationHubNamespace 'Microsoft.NotificationHubs/namespaces@2023-01-01-preview' = {
  name: '${baseName}-nhns-${locationShort}'
  location: location
  sku: {
    name: 'Standard'
  }
}

resource notificationHub 'Microsoft.NotificationHubs/namespaces/notificationHubs@2023-01-01-preview' = {
  parent: notificationHubNamespace
  name: '${baseName}-nh'
  location: location
  properties: {
    apnsCredential: {
      properties: {
        appName: 'PhoenixRooivalk'
        appId: apnsAppId
        keyId: apnsKeyId
        token: apnsToken
        endpoint: 'https://api.push.apple.com'
      }
    }
    gcmCredential: {
      properties: {
        googleApiKey: fcmApiKey
      }
    }
    wnsCredential: {
      properties: {
        packageSid: wnsPackageSid
        secretKey: wnsSecretKey
      }
    }
  }
}
```

---

## Consequences

### Positive

- **Cross-platform**: Single API for all platforms
- **Scalability**: Azure handles millions of notifications
- **Reliability**: Built-in retry and delivery tracking
- **Targeting**: Tag-based routing for flexible delivery

### Negative

- **Azure dependency**: Vendor lock-in
- **Cost**: Per-notification pricing
- **Latency**: Additional hop through Azure

---

## Related ADRs

- [ADR 0043: Real-time Communication](./adr-0043-realtime-communication)
- [ADR 0070: Multi-Tenancy](./adr-0070-multi-tenancy)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
