# Configuration Guide

This guide covers configuration for the documentation site's interactive
features, analytics, and Azure cloud integration.

## Table of Contents

1. [Azure Setup](#azure-setup)
2. [Authentication](#authentication)
3. [Cookie Consent (GDPR)](#cookie-consent-gdpr)
4. [Analytics](#analytics)
5. [Offline Support](#offline-support)
6. [Rate Limiting](#rate-limiting)
7. [Error Boundaries](#error-boundaries)
8. [Azure Functions](#azure-functions)
9. [AI Features](#ai-features)
10. [Testing](#testing)
11. [Environment Variables](#environment-variables)

---

## Azure Setup

### Prerequisites

1. Create an Azure account at [Azure Portal](https://portal.azure.com)
2. Set up Azure Entra ID (formerly Azure AD) for authentication
3. Create an Azure Cosmos DB account for data storage
4. Create an Azure Functions app for serverless functions
5. (Optional) Set up Azure Application Insights for analytics

### Configuration

Environment variables are configured in Azure Static Web Apps and exposed via
`docusaurus.config.ts`:

```typescript
// docusaurus.config.ts
const config: Config = {
  customFields: {
    azureEntraClientId: process.env.AZURE_ENTRA_CLIENT_ID,
    azureEntraTenantId: process.env.AZURE_ENTRA_TENANT_ID,
    azureFunctionsBaseUrl: process.env.AZURE_FUNCTIONS_BASE_URL,
    appInsightsConnectionString: process.env.APPINSIGHTS_CONNECTION_STRING,
  },
};
```

### Cosmos DB Setup

1. Create a Cosmos DB account with SQL API
2. Create a database (e.g., `phoenixrooivalk-docs`)
3. Create containers for:
   - `users` - User profiles and progress
   - `comments` - Comment system
   - `analytics_*` - Analytics collections

---

## Authentication

### Supported Providers

- Google OAuth (via Azure AD B2C or social identity providers)
- GitHub OAuth (via Azure AD B2C or social identity providers)

### Configuration

1. **Set up Azure Entra ID** in Azure Portal > Azure Active Directory

2. **Register an application**:
   - Go to App registrations > New registration
   - Set redirect URIs for your domains
   - Note the Application (client) ID and Directory (tenant) ID

3. **Configure identity providers**:
   - For Google: Add Google as an identity provider in Azure AD B2C
   - For GitHub: Add GitHub as an identity provider in Azure AD B2C

4. **AuthContext** (`src/contexts/AuthContext.tsx`) handles:
   - Sign in/out flows via MSAL.js
   - User state management
   - Progress syncing with Cosmos DB
   - Offline queue processing

### Usage

```tsx
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { user, signInGoogle, signOut, userProgress } = useAuth();

  if (!user) {
    return <button onClick={signInGoogle}>Sign In</button>;
  }

  return <div>Welcome, {user.displayName}</div>;
}
```

---

## Cookie Consent (GDPR)

### Overview

GDPR-compliant cookie consent banner with granular consent options.

### Configuration

Consent categories in `src/components/CookieConsent/CookieConsent.tsx`:

| Category     | Purpose                               | Default   |
| ------------ | ------------------------------------- | --------- |
| `necessary`  | Essential site functionality          | Always on |
| `analytics`  | Usage tracking (Application Insights) | Off       |
| `functional` | Progress tracking, preferences        | Off       |

### Customization

```typescript
// Default consent state
const defaultConsent: ConsentState = {
  necessary: true, // Cannot be disabled
  analytics: false, // Opt-in required
  functional: false, // Opt-in required
  consented: false,
  timestamp: null,
};
```

### Checking Consent

```typescript
import { getConsent, hasConsent } from "../components/CookieConsent";

// Check specific category
if (hasConsent("analytics")) {
  // Track analytics
}

// Get full consent state
const consent = getConsent();
```

---

## Analytics

### Azure Application Insights

Analytics are tracked via Azure Application Insights:

| Event Type    | Data                          | Purpose          |
| ------------- | ----------------------------- | ---------------- |
| Page Views    | Page visits, paths, referrers | Usage tracking   |
| Time on Page  | Time spent on pages           | Engagement       |
| Conversions   | CTA clicks, sign-ups          | Funnel analysis  |
| Custom Events | Feature usage                 | Product insights |

### Rate Limits

Analytics calls are rate-limited to prevent abuse:

| Event Type   | Limit     |
| ------------ | --------- |
| Page views   | 30/minute |
| Conversions  | 20/minute |
| Time on page | 60/minute |
| Daily stats  | 30/minute |

### Time Tracking

The `ReadingTracker` component tracks:

- Active reading time (tab focused)
- Per-document time spent
- Total time across all docs

Time is tracked when:

- Tab is visible (Visibility API)
- Window is focused
- Updates every 5 seconds

---

## Offline Support

### Features

- Queue updates when offline
- Automatic sync when connection restored
- Visual offline indicator
- LocalStorage persistence

### Configuration

Queue settings in `src/components/Offline/OfflineSync.tsx`:

```typescript
const QUEUE_KEY = "phoenixRooivalk_offlineQueue";
const MAX_QUEUE_SIZE = 100; // Maximum queued updates
```

### Usage

```typescript
import { queueUpdate, getQueuedUpdates } from "../components/Offline";

// Queue an update
queueUpdate({
  type: "progress",
  data: { docId: "example", completed: true },
  userId: user.uid,
});

// Get pending updates
const pending = getQueuedUpdates();
console.log(`${pending.length} updates pending`);
```

---

## Rate Limiting

### Overview

Client-side rate limiting protects against excessive API calls.

### Utilities

```typescript
import {
  checkRateLimit,
  throttle,
  debounce,
  RateLimitedExecutor,
} from "../utils/rateLimiter";
```

### Functions

#### checkRateLimit

```typescript
// Allow max 10 calls per minute
if (checkRateLimit("myAction", 10, 60000)) {
  // Proceed with action
} else {
  // Rate limited - skip or queue
}
```

#### throttle

```typescript
// Execute at most once per second
const throttledSave = throttle(saveData, 1000);
throttledSave(); // Executes
throttledSave(); // Skipped (within 1s)
```

#### debounce

```typescript
// Wait for 500ms of inactivity
const debouncedSearch = debounce(search, 500);
debouncedSearch("a"); // Cancelled
debouncedSearch("ab"); // Cancelled
debouncedSearch("abc"); // Executes after 500ms
```

---

## Error Boundaries

### Overview

React Error Boundaries prevent component crashes from breaking the entire app.

### Components

#### ErrorBoundary

```tsx
import { ErrorBoundary } from "../components/ErrorBoundary";

<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <RiskyComponent />
</ErrorBoundary>;
```

#### SilentErrorBoundary

```tsx
import { SilentErrorBoundary } from "../components/ErrorBoundary";

<SilentErrorBoundary>
  <AnalyticsTracker /> {/* Won't break page if it fails */}
</SilentErrorBoundary>;
```

---

## Azure Functions

### Overview

Azure Functions handle AI features, data operations, and scheduled tasks.

### Functions

| Function                    | Trigger   | Purpose                  |
| --------------------------- | --------- | ------------------------ |
| `analyzeCompetitors`        | HTTP POST | AI competitor analysis   |
| `getMarketInsights`         | HTTP POST | AI market intelligence   |
| `summarizeContent`          | HTTP POST | AI content summarization |
| `getReadingRecommendations` | HTTP POST | AI reading suggestions   |
| `suggestImprovements`       | HTTP POST | AI document improvements |

### Deployment

```bash
cd apps/docs/azure-functions
npm install
npm run build
# Deploy via Azure CLI or GitHub Actions
az functionapp deployment source config-zip -g <resource-group> -n <app-name> --src dist.zip
```

### Configuration

Functions require these environment variables in Azure:

| Variable            | Description                 |
| ------------------- | --------------------------- |
| `OPENAI_API_KEY`    | OpenAI API key for AI       |
| `COSMOS_CONNECTION` | Cosmos DB connection string |
| `JWT_SECRET`        | JWT verification secret     |

---

## AI Features

### Overview

| Feature                 | Description                         | Endpoint                    |
| ----------------------- | ----------------------------------- | --------------------------- |
| Competitor Analysis     | Analyze defense market competitors  | `analyzeCompetitors`        |
| Market Insights         | Get market intelligence and trends  | `getMarketInsights`         |
| Reading Recommendations | AI-powered reading suggestions      | `getReadingRecommendations` |
| Document Improvements   | Suggest doc improvements for review | `suggestImprovements`       |
| Content Summary         | Summarize page content              | `summarizeContent`          |

### Rate Limiting

AI features are rate-limited per user:

| Feature               | Limit     |
| --------------------- | --------- |
| Competitor Analysis   | 20/hour   |
| Market Insights       | 20/hour   |
| Document Improvements | 5/minute  |
| Content Summary       | 10/minute |

### Using the AI Panel

The AI Panel appears as a floating button for authenticated users. It provides:

1. **Competitor Analysis** - Detailed competitive analysis
2. **Market Insights** - Counter-UAS market intelligence
3. **Reading Recommendations** - Based on user's reading history
4. **Document Improvements** - AI-suggested improvements for review
5. **Content Summary** - Quick overview of pages

---

## Testing

### Setup

```bash
cd apps/docs
npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Test Files

Tests are located alongside source files:

```
src/
  utils/
    rateLimiter.ts
    __tests__/
      rateLimiter.test.ts
  components/
    Offline/
      OfflineSync.tsx
      __tests__/
        OfflineSync.test.ts
```

---

## Environment Variables

### Required for Production

| Variable                        | Description                      |
| ------------------------------- | -------------------------------- |
| `AZURE_ENTRA_CLIENT_ID`         | Azure AD Application (client) ID |
| `AZURE_ENTRA_TENANT_ID`         | Azure AD Directory (tenant) ID   |
| `AZURE_FUNCTIONS_BASE_URL`      | Base URL for Azure Functions app |
| `APPINSIGHTS_CONNECTION_STRING` | Application Insights connection  |

### Optional

| Variable          | Description                            |
| ----------------- | -------------------------------------- |
| `COSMOS_ENDPOINT` | Cosmos DB endpoint (for direct access) |
| `COSMOS_KEY`      | Cosmos DB primary key                  |

### Azure Functions Environment

Set in Azure Portal > Function App > Configuration:

| Variable             | Description                 |
| -------------------- | --------------------------- |
| `OPENAI_API_KEY`     | OpenAI API key for AI       |
| `CosmosDbConnection` | Cosmos DB connection string |

### Setting Up Azure Entra ID

1. Go to Azure Portal > Azure Active Directory > App registrations
2. Create a new registration
3. Note the Application (client) ID and Directory (tenant) ID
4. Configure authentication redirect URIs
5. Set up API permissions as needed

---

## Troubleshooting

### Common Issues

**Azure authentication errors**

- Check Azure Entra ID configuration
- Verify redirect URIs match your domain
- Check tenant and client IDs are correct

**Authentication not working**

- Verify identity provider configuration in Azure AD B2C
- Check authorized redirect URIs
- Ensure MSAL.js is properly initialized

**Analytics not tracking**

- Check cookie consent status
- Verify Application Insights connection string
- Check browser console for errors

**Offline sync not working**

- Check localStorage availability
- Verify navigator.onLine is accurate
- Check queue size limits

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem("debug", "phoenix:*");
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Cookie    │  │   Error     │  │   Offline           │ │
│  │   Consent   │  │  Boundaries │  │   Indicator         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    AuthContext                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │  Progress   │  │  Analytics  │  │  Reading        │ ││
│  │  │  Tracking   │  │  Tracker    │  │  Tracker        │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Rate Limiter                           ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Offline Queue                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Azure Cloud                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Azure Entra │  │  Cosmos DB  │  │  Azure Functions    │ │
│  │  ID (Auth)  │  │  (Data)     │  │  (AI & APIs)        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Application Insights (Analytics)           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```
