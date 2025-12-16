---
id: adr-0043-realtime-communication
title: "ADR 0043: Real-time Communication Architecture"
sidebar_label: "ADR 0043: Real-time Comms"
difficulty: intermediate
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - communication
  - websocket
  - signalr
  - real-time
prerequisites:
  - architecture-decision-records
  - adr-0040-edge-cloud-communication
---

# ADR 0043: Real-time Communication Architecture

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Operator interfaces require real-time updates (<500ms) for
   situational awareness, alerts, and system control
2. **Decision**: Implement Azure SignalR for cloud-to-client real-time
   communication with WebSocket fallback and priority messaging
3. **Trade-off**: Infrastructure cost vs. real-time responsiveness

---

## Context

### Use Cases

| Use Case            | Latency Requirement | Direction             |
| ------------------- | ------------------- | --------------------- |
| Track updates       | <500ms              | Edge → Cloud → Client |
| Alert notifications | <200ms              | Cloud → Client        |
| Operator commands   | <100ms              | Client → Cloud → Edge |
| System status       | <1s                 | Edge → Cloud → Client |
| Video streams       | <2s                 | Edge → Cloud → Client |

### Requirements

| Requirement | Specification                    |
| ----------- | -------------------------------- |
| Latency     | <500ms typical, <2s max          |
| Connections | 100+ concurrent operators        |
| Reliability | Auto-reconnect, message ordering |
| Security    | Authenticated, encrypted         |
| Scalability | Horizontal scaling               |

---

## Decision

Adopt **Azure SignalR Service** with custom protocol layers:

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Real-time Communication Architecture                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  OPERATOR CLIENT                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      Web/Desktop App                             ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   SignalR    │  │   Message    │  │     UI       │          ││
│  │  │   Client     │──│   Handler    │──│   Updates    │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│              │ WebSocket/SSE                                        │
│              ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Azure SignalR Service                         ││
│  │  • Connection management                                         ││
│  │  • Message routing                                               ││
│  │  • Auto-scaling                                                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│              │                                                       │
│              ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Azure Functions Hub                           ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Track      │  │   Alert      │  │   Command    │          ││
│  │  │   Handler    │  │   Publisher  │  │   Processor  │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│              ▲                                                       │
│              │ Service Bus / Direct                                 │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Edge Sync Gateway                             ││
│  │  ┌──────────────┐  ┌──────────────┐                             ││
│  │  │   Inbound    │  │   Outbound   │                             ││
│  │  │   Queue      │  │   Router     │                             ││
│  │  └──────────────┘  └──────────────┘                             ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Message Types

### Track Update

```typescript
interface TrackUpdate {
  type: "track.update";
  trackId: string;
  timestamp: number;
  position: {
    lat: number;
    lon: number;
    alt: number;
  };
  velocity: {
    speed: number;
    heading: number;
    climb: number;
  };
  classification: {
    type: string;
    confidence: number;
    threat: boolean;
  };
  nodeId: string;
}
```

### Alert Notification

```typescript
interface AlertNotification {
  type: "alert";
  alertId: string;
  severity: "critical" | "warning" | "info";
  timestamp: number;
  title: string;
  message: string;
  sourceNode?: string;
  trackId?: string;
  actions?: AlertAction[];
}

interface AlertAction {
  id: string;
  label: string;
  action: "acknowledge" | "engage" | "dismiss" | "escalate";
}
```

### Operator Command

```typescript
interface OperatorCommand {
  type: "command";
  commandId: string;
  targetNode: string;
  action: string;
  params: Record<string, unknown>;
  authToken: string;
  timestamp: number;
}
```

---

## SignalR Hub Implementation

### Hub Definition

```csharp
public class OperatorHub : Hub
{
    private readonly ITrackService _trackService;
    private readonly IAlertService _alertService;
    private readonly ICommandService _commandService;

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        var role = Context.User?.FindFirst("role")?.Value;

        // Add to role-based groups
        if (role == "operator")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "operators");
        }

        // Send initial state
        await Clients.Caller.SendAsync("InitialState", new
        {
            Tracks = await _trackService.GetActiveTracks(),
            Alerts = await _alertService.GetActiveAlerts(),
            SystemStatus = await GetSystemStatus()
        });

        await base.OnConnectedAsync();
    }

    public async Task SubscribeToNode(string nodeId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"node:{nodeId}");
    }

    public async Task SendCommand(OperatorCommand command)
    {
        // Validate authorization
        if (!await _commandService.ValidateAuthorization(Context.User, command))
        {
            throw new HubException("Unauthorized command");
        }

        // Process command
        var result = await _commandService.ProcessCommand(command);

        // Notify sender
        await Clients.Caller.SendAsync("CommandResult", result);

        // Log for audit
        await _commandService.LogCommand(Context.User, command, result);
    }
}
```

### Broadcast Functions

```csharp
// Azure Function triggered by track updates
[Function("BroadcastTrackUpdate")]
public async Task BroadcastTrackUpdate(
    [ServiceBusTrigger("track-updates")] TrackUpdate update,
    [SignalROutput(HubName = "operator")] IAsyncCollector<SignalRMessage> signalRMessages)
{
    // Broadcast to all operators
    await signalRMessages.AddAsync(new SignalRMessage
    {
        Target = "TrackUpdate",
        Arguments = new[] { update },
        GroupName = "operators"
    });

    // Also to node-specific subscribers
    await signalRMessages.AddAsync(new SignalRMessage
    {
        Target = "TrackUpdate",
        Arguments = new[] { update },
        GroupName = $"node:{update.NodeId}"
    });
}

// Azure Function for alerts
[Function("BroadcastAlert")]
public async Task BroadcastAlert(
    [CosmosDBTrigger("alerts", Connection = "CosmosConnection")] Alert alert,
    [SignalROutput(HubName = "operator")] IAsyncCollector<SignalRMessage> signalRMessages)
{
    await signalRMessages.AddAsync(new SignalRMessage
    {
        Target = "Alert",
        Arguments = new[] { alert },
        GroupName = alert.Severity == "critical" ? "operators" : $"node:{alert.NodeId}"
    });
}
```

---

## Client Implementation

### React Hook

```typescript
import { useEffect, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";

export function useSignalR() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null,
  );
  const [connectionState, setConnectionState] =
    useState<signalR.HubConnectionState>(
      signalR.HubConnectionState.Disconnected,
    );

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl("/api/signalr", {
        accessTokenFactory: () => getAuthToken(),
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0, 2, 4, 8, 16, 30, 30, 30...
          return Math.min(
            Math.pow(2, retryContext.previousRetryCount) * 1000,
            30000,
          );
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    conn.onclose(() =>
      setConnectionState(signalR.HubConnectionState.Disconnected),
    );
    conn.onreconnecting(() =>
      setConnectionState(signalR.HubConnectionState.Reconnecting),
    );
    conn.onreconnected(() =>
      setConnectionState(signalR.HubConnectionState.Connected),
    );

    conn
      .start()
      .then(() => setConnectionState(signalR.HubConnectionState.Connected))
      .catch(console.error);

    setConnection(conn);

    return () => {
      conn.stop();
    };
  }, []);

  const subscribe = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      if (connection) {
        connection.on(event, handler);
        return () => connection.off(event, handler);
      }
    },
    [connection],
  );

  const send = useCallback(
    async (method: string, ...args: any[]) => {
      if (connection?.state === signalR.HubConnectionState.Connected) {
        return connection.invoke(method, ...args);
      }
      throw new Error("Not connected");
    },
    [connection],
  );

  return { connection, connectionState, subscribe, send };
}
```

### Track Updates Hook

```typescript
export function useTracks() {
  const { subscribe } = useSignalR();
  const [tracks, setTracks] = useState<Map<string, Track>>(new Map());

  useEffect(() => {
    const unsubscribe = subscribe("TrackUpdate", (update: TrackUpdate) => {
      setTracks((prev) => {
        const next = new Map(prev);
        next.set(update.trackId, {
          ...update,
          lastSeen: Date.now(),
        });
        return next;
      });
    });

    return unsubscribe;
  }, [subscribe]);

  // Prune stale tracks
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTracks((prev) => {
        const next = new Map();
        for (const [id, track] of prev) {
          if (now - track.lastSeen < 30000) {
            next.set(id, track);
          }
        }
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { tracks: Array.from(tracks.values()) };
}
```

---

## Priority Messaging

### Message Prioritization

```typescript
enum MessagePriority {
  Critical = 0, // Engagement alerts
  High = 1, // Active track updates
  Normal = 2, // Status updates
  Low = 3, // Telemetry
}

interface PrioritizedMessage {
  priority: MessagePriority;
  message: unknown;
  timestamp: number;
}

class MessageQueue {
  private queues: PrioritizedMessage[][] = [[], [], [], []];

  enqueue(msg: PrioritizedMessage) {
    this.queues[msg.priority].push(msg);
  }

  dequeue(): PrioritizedMessage | null {
    for (const queue of this.queues) {
      if (queue.length > 0) {
        return queue.shift()!;
      }
    }
    return null;
  }
}
```

---

## Scaling Configuration

### Azure SignalR Settings

```bicep
resource signalR 'Microsoft.SignalRService/signalR@2023-02-01' = {
  name: '${baseName}-signalr-${locationShort}'
  location: location
  sku: {
    name: 'Standard_S1'
    tier: 'Standard'
    capacity: 1  // Scale based on connections
  }
  properties: {
    features: [
      {
        flag: 'ServiceMode'
        value: 'Serverless'  // Azure Functions backend
      }
      {
        flag: 'EnableConnectivityLogs'
        value: 'true'
      }
    ]
    cors: {
      allowedOrigins: [
        'https://rooivalk.dev'
        'https://staging.rooivalk.dev'
      ]
    }
  }
}
```

---

## Consequences

### Positive

- **Low latency**: <500ms typical message delivery
- **Scalability**: Azure SignalR handles scaling
- **Reliability**: Auto-reconnect, message ordering
- **Security**: JWT authentication, encrypted transport

### Negative

- **Cost**: SignalR Service charges per unit
- **Complexity**: Multiple message types and handlers
- **Dependencies**: Azure-specific service

---

## Related ADRs

- [ADR 0040: Edge-Cloud Communication](./adr-0040-edge-cloud-communication)
- [ADR 0041: Mesh Networking](./adr-0041-mesh-networking)
- [ADR 0044: Push Notifications](./adr-0044-push-notifications)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
