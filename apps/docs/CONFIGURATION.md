# Configuration Guide

This guide covers configuration for the documentation site's interactive features, analytics, and Firebase integration.

## Table of Contents

1. [Firebase Setup](#firebase-setup)
2. [Authentication](#authentication)
3. [Cookie Consent (GDPR)](#cookie-consent-gdpr)
4. [Analytics](#analytics)
5. [Offline Support](#offline-support)
6. [Rate Limiting](#rate-limiting)
7. [Error Boundaries](#error-boundaries)
8. [Cloud Functions](#cloud-functions)
9. [AI Features](#ai-features)
10. [Testing](#testing)
11. [Environment Variables](#environment-variables)

---

## Firebase Setup

### Prerequisites

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication with desired providers

### Configuration

Create `src/services/firebaseConfig.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Firestore Security Rules

Deploy the security rules from `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

Key rules:
- Users can only read/write their own progress data
- Analytics writes require authentication
- Admin functions require admin claims

### Firestore Indexes

Deploy indexes from `firestore.indexes.json`:

```bash
firebase deploy --only firestore:indexes
```

---

## Authentication

### Supported Providers

- Google OAuth
- GitHub OAuth

### Configuration

1. **Enable providers** in Firebase Console > Authentication > Sign-in method

2. **Configure OAuth** for each provider:
   - Google: Enabled by default with Firebase
   - GitHub: Create OAuth app at GitHub Developer Settings

3. **AuthContext** (`src/contexts/AuthContext.tsx`) handles:
   - Sign in/out flows
   - User state management
   - Progress syncing with Firestore
   - Offline queue processing

### Usage

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, signInWithGoogle, signOut, userProgress } = useAuth();

  if (!user) {
    return <button onClick={signInWithGoogle}>Sign In</button>;
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

| Category | Purpose | Default |
|----------|---------|---------|
| `necessary` | Essential site functionality | Always on |
| `analytics` | Usage tracking (GA4, Firestore) | Off |
| `functional` | Progress tracking, preferences | Off |

### Customization

```typescript
// Default consent state
const defaultConsent: ConsentState = {
  necessary: true,    // Cannot be disabled
  analytics: false,   // Opt-in required
  functional: false,  // Opt-in required
  consented: false,
  timestamp: null,
};
```

### Checking Consent

```typescript
import { getConsent, hasConsent } from '../components/CookieConsent';

// Check specific category
if (hasConsent('analytics')) {
  // Track analytics
}

// Get full consent state
const consent = getConsent();
```

### Styling

Customize appearance in `src/components/CookieConsent/CookieConsent.css`:
- `.cookie-consent-banner` - Main banner container
- `.cookie-consent-content` - Text content area
- `.cookie-consent-buttons` - Button container

---

## Analytics

### Firestore Analytics

Analytics are tracked to Firestore collections:

| Collection | Data | Retention |
|------------|------|-----------|
| `analytics_pageviews` | Page visits, paths, referrers | 90 days |
| `analytics_timeonpage` | Time spent on pages | 90 days |
| `analytics_conversions` | CTA clicks, sign-ups | 365 days |
| `analytics_sessions` | User sessions | 30 days |
| `analytics_daily` | Aggregated daily stats | 365 days |

### Rate Limits

Analytics calls are rate-limited to prevent abuse:

| Event Type | Limit |
|------------|-------|
| Page views | 30/minute |
| Conversions | 20/minute |
| Time on page | 60/minute |
| Daily stats | 30/minute |

### Time Tracking

The `ReadingTracker` component tracks:
- Active reading time (tab focused)
- Per-document time spent
- Total time across all docs

Time is tracked when:
- Tab is visible (Visibility API)
- Window is focused
- Updates every 5 seconds

### Google Analytics 4 (Optional)

To add GA4 alongside Firestore analytics:

1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID (G-XXXXXXXXXX)
3. See [Real Analytics Integration](#real-analytics-integration-ga4) section

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
const QUEUE_KEY = 'phoenixRooivalk_offlineQueue';
const MAX_QUEUE_SIZE = 100;  // Maximum queued updates
```

### Usage

```typescript
import { queueUpdate, getQueuedUpdates } from '../components/Offline';

// Queue an update
queueUpdate({
  type: 'progress',
  data: { docId: 'example', completed: true },
  userId: user.uid,
});

// Get pending updates
const pending = getQueuedUpdates();
console.log(`${pending.length} updates pending`);
```

### Offline Indicator

The `OfflineIndicator` component displays:
- Connection status
- Number of pending updates
- Auto-hides when online with no pending updates

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
  RateLimitedExecutor
} from '../utils/rateLimiter';
```

### Functions

#### checkRateLimit

```typescript
// Allow max 10 calls per minute
if (checkRateLimit('myAction', 10, 60000)) {
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
debouncedSearch('a');  // Cancelled
debouncedSearch('ab'); // Cancelled
debouncedSearch('abc'); // Executes after 500ms
```

#### RateLimitedExecutor

```typescript
const executor = new RateLimitedExecutor<void>(
  async () => { /* action */ },
  { maxCalls: 5, windowMs: 60000 }
);

await executor.execute(); // Respects rate limit
```

---

## Error Boundaries

### Overview

React Error Boundaries prevent component crashes from breaking the entire app.

### Components

#### ErrorBoundary

Full error boundary with fallback UI:

```tsx
import { ErrorBoundary } from '../components/ErrorBoundary';

<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <RiskyComponent />
</ErrorBoundary>
```

#### SilentErrorBoundary

Catches errors silently (for non-critical features):

```tsx
import { SilentErrorBoundary } from '../components/ErrorBoundary';

<SilentErrorBoundary>
  <AnalyticsTracker />  {/* Won't break page if it fails */}
</SilentErrorBoundary>
```

#### withErrorBoundary HOC

```tsx
import { withErrorBoundary } from '../components/ErrorBoundary';

const SafeComponent = withErrorBoundary(RiskyComponent, {
  fallback: <div>Fallback UI</div>
});
```

### Usage in Root.tsx

Non-critical components are wrapped with SilentErrorBoundary:

```tsx
<AuthProvider>
  <SilentErrorBoundary><ReadingTracker /></SilentErrorBoundary>
  <SilentErrorBoundary><AnalyticsTracker /></SilentErrorBoundary>
  {children}
  <SilentErrorBoundary><CookieConsentBanner /></SilentErrorBoundary>
  <SilentErrorBoundary><OfflineIndicator /></SilentErrorBoundary>
</AuthProvider>
```

---

## Cloud Functions

### Overview

Firebase Cloud Functions handle data retention and cleanup tasks.

### Functions

| Function | Schedule | Purpose |
|----------|----------|---------|
| `cleanupOldAnalytics` | Daily 3am UTC | Remove old analytics data |
| `cleanupInactiveSessions` | Daily 4am UTC | Remove stale sessions |
| `archiveDailyStats` | Weekly Sunday 5am | Archive old daily stats |
| `manualCleanup` | On-demand | Admin-triggered cleanup |
| `onUserDeleted` | Auth trigger | Clean up user data |

### Retention Configuration

In `functions/src/index.ts`:

```typescript
const RETENTION_CONFIG = {
  pageViews: 90,     // 90 days
  timeOnPage: 90,    // 90 days
  conversions: 365,  // 1 year
  sessions: 30,      // 30 days
  dailyStats: 365,   // 1 year
};
```

### Deployment

```bash
cd apps/docs/functions
npm install
npm run build
firebase deploy --only functions
```

### Manual Cleanup (Admin)

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const manualCleanup = httpsCallable(functions, 'manualCleanup');

// Requires admin token
await manualCleanup({
  collection: 'analytics_pageviews',
  days: 30  // Delete data older than 30 days
});
```

---

## AI Features

The documentation site includes AI-powered features for research, recommendations, and document improvement.

### Overview

| Feature | Description | Endpoint |
|---------|-------------|----------|
| Competitor Analysis | Analyze defense market competitors | `analyzeCompetitors` |
| SWOT Analysis | Generate strategic SWOT analyses | `generateSWOT` |
| Market Insights | Get market intelligence and trends | `getMarketInsights` |
| Reading Recommendations | AI-powered reading suggestions | `getReadingRecommendations` |
| Document Improvements | Suggest doc improvements for review | `suggestDocumentImprovements` |
| Content Summary | Summarize page content | `summarizeContent` |

### Setup

1. **Configure OpenAI API Key**

```bash
firebase functions:config:set openai.key="sk-your-openai-api-key"
```

2. **Deploy Functions**

```bash
cd apps/docs/functions
npm install
npm run build
firebase deploy --only functions
```

### Using the AI Panel

The AI Panel appears as a floating button (🤖) for authenticated users. It provides:

1. **Competitor Analysis**
   - Select from known competitors or add custom ones
   - Quick presets: Kinetic, Electronic, Laser, Major Players
   - Generates detailed competitive analysis

2. **SWOT Analysis**
   - Enter any topic for strategic analysis
   - Pre-defined topics for Phoenix Rooivalk
   - Includes strengths, weaknesses, opportunities, threats

3. **Market Insights**
   - Counter-UAS market intelligence
   - Regulatory landscape analysis
   - Investment and M&A trends

4. **Reading Recommendations**
   - Based on user's reading history
   - Suggests logical next articles
   - Shows relevance scores

5. **Document Improvements**
   - AI analyzes current page
   - Suggests clarity, structure, content improvements
   - Submissions go to admin review queue

6. **Content Summary**
   - Summarize current page or custom content
   - Useful for quick overview

### Rate Limiting

AI features are rate-limited per user:

| Feature | Limit |
|---------|-------|
| Competitor Analysis | 20/hour |
| SWOT Analysis | 20/hour |
| Market Insights | 20/hour |
| Document Improvements | 20/hour |
| Content Summary | 20/hour |

### Reading Recommendations Component

Embed recommendations in your pages:

```tsx
import { ReadingRecommendations } from '../components/AIPanel';

// Compact widget for sidebar
<ReadingRecommendations variant="compact" maxItems={3} />

// Full panel with stats
<ReadingRecommendations variant="full" showHeading={true} />
```

Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxItems` | number | 3 | Max recommendations to show |
| `variant` | "compact" \| "full" | "compact" | Display style |
| `currentDocId` | string | - | Current document for context |
| `showHeading` | boolean | true | Show section heading |
| `autoRefresh` | number | 0 | Auto-refresh interval (ms) |

### Admin Review Panel

Admins can review document improvement suggestions:

```tsx
import { AdminImprovementReview } from '../components/AIPanel';

// On an admin page
<AdminImprovementReview pageSize={10} />
```

Actions available:
- **Approve** - Mark suggestion as approved
- **Implemented** - Suggestion was implemented
- **Reject** - Decline the suggestion

Users receive notifications when their suggestions are reviewed.

### AI Service API

Use the AI service directly:

```typescript
import { aiService } from '../services/aiService';

// Competitor analysis
const result = await aiService.analyzeCompetitors(
  ['Anduril', 'DroneShield'],
  ['technology', 'market-position']
);

// SWOT analysis
const swot = await aiService.generateSWOT(
  'Phoenix Rooivalk Market Entry',
  'Focus on European defense market'
);

// Reading recommendations
const recs = await aiService.getReadingRecommendations('/docs/overview');

// Document improvements
const improvements = await aiService.suggestDocumentImprovements(
  '/docs/technical/architecture',
  'Technical Architecture',
  documentContent
);
```

### Firestore Collections

AI features use these collections:

| Collection | Purpose |
|------------|---------|
| `ai_rate_limits` | Rate limiting per user/feature |
| `ai_usage` | Usage tracking and analytics |
| `document_improvements` | Improvement suggestions queue |
| `documentation_meta` | Document metadata for recommendations |
| `notifications` | User notifications |

### Cost Considerations

AI features use OpenAI API with different models:

| Feature | Model | Approx Cost |
|---------|-------|-------------|
| Competitor Analysis | gpt-4o | ~$0.02/request |
| SWOT Analysis | gpt-4o-mini | ~$0.005/request |
| Market Insights | gpt-4o | ~$0.02/request |
| Document Improvements | gpt-4o | ~$0.02/request |
| Recommendations | gpt-4o-mini | ~$0.003/request |
| Summary | gpt-4o-mini | ~$0.003/request |

With rate limits (20/hour/user), maximum cost per user is approximately $0.40/hour for heavy usage.

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

### Configuration

Jest configuration in `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
};
```

---

## Environment Variables

### Required for Production

| Variable | Description |
|----------|-------------|
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Auth domain |
| `FIREBASE_PROJECT_ID` | Project ID |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `FIREBASE_APP_ID` | Firebase app ID |
| `FIREBASE_MEASUREMENT_ID` | GA4 Measurement ID (optional, for GA4 analytics) |

### GitHub Actions Secrets

For CI/CD deployment:

| Secret | Description |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `NETLIFY_AUTH_TOKEN` | Netlify deployment token |
| `NETLIFY_SITE_ID` | Netlify site ID |

### Setting up Firebase Service Account

1. Go to Firebase Console > Project Settings > Service accounts
2. Click "Generate new private key"
3. Copy the JSON content
4. Add as `FIREBASE_SERVICE_ACCOUNT` secret in GitHub

### Firebase Functions Configuration

For AI features, configure the OpenAI API key:

```bash
# Set OpenAI API key for Cloud Functions
firebase functions:config:set openai.key="sk-your-openai-api-key"

# Verify configuration
firebase functions:config:get

# Deploy with new config
firebase deploy --only functions
```

---

## Real Analytics Integration (GA4)

GA4 is integrated into the existing analytics service and works alongside Firestore analytics.

### Setup

1. **Create GA4 Property**
   - Go to [analytics.google.com](https://analytics.google.com)
   - Admin > Create Property
   - Set up a Web data stream
   - Copy Measurement ID (G-XXXXXXXXXX)

2. **Add Environment Variable**

Add to your environment:

```bash
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. **Automatic Integration**

GA4 tracking is automatically enabled when the measurement ID is configured. The analytics service (`src/services/analytics.ts`) automatically tracks:

| Event | GA4 Event Name | When Triggered |
|-------|----------------|----------------|
| Page view | `page_view` | User visits a page |
| Time on page | `user_engagement` | User leaves page |
| Teaser view | `view_item` | Non-auth user sees teaser |
| Signup prompt | `view_promotion` | Signup prompt shown |
| Signup started | `begin_checkout` | User clicks sign-in |
| Signup completed | `sign_up` | User completes auth |
| First doc read | `tutorial_complete` | User reads first doc |
| Achievement | `unlock_achievement` | User earns achievement |
| Path completed | `level_end` | User completes learning path |

### Consent Integration

GA4 tracking respects GDPR consent. Events are only sent when the user has consented to analytics cookies:

```typescript
// Automatically checked in analytics service
if (hasConsent('analytics')) {
  // GA4 events are tracked
}
```

### Custom Events

Track custom events using the analytics service:

```typescript
import { analytics } from '../services/analytics';

// The service handles both Firestore and GA4 tracking
await analytics.trackConversion('achievement_unlocked', userId, {
  achievement_id: 'first_steps',
  achievement_name: 'First Steps',
});
```

### Viewing Reports

1. Go to [analytics.google.com](https://analytics.google.com)
2. Select your property
3. View real-time, engagement, and conversion reports
4. Create custom explorations for deeper analysis

---

## Troubleshooting

### Common Issues

**Firebase connection errors**
- Check firebaseConfig values
- Verify Firestore rules allow access
- Check network/CORS settings

**Authentication not working**
- Verify OAuth provider configuration
- Check authorized domains in Firebase Console
- Ensure callback URLs are correct

**Analytics not tracking**
- Check cookie consent status
- Verify rate limits aren't blocking
- Check browser console for errors

**Offline sync not working**
- Check localStorage availability
- Verify navigator.onLine is accurate
- Check queue size limits

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('debug', 'phoenix:*');
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
│                      Firebase                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Auth      │  │  Firestore  │  │   Cloud Functions   │ │
│  │  (OAuth)    │  │  (Data)     │  │   (Cleanup)         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```
