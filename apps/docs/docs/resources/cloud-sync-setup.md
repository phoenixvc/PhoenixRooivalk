---
id: cloud-sync-setup
title: Cloud Sync Setup Guide
sidebar_label: Cloud Sync Setup
description: Configure Firebase to enable cross-device progress synchronization
---

# Cloud Sync Setup Guide

Enable cross-device synchronization for your reading progress and achievements
by configuring Firebase.

---

## Overview

The gamification system supports two modes:

| Mode      | Storage              | Cross-Device | Setup Required   |
| --------- | -------------------- | ------------ | ---------------- |
| **Local** | Browser localStorage | No           | None             |
| **Cloud** | Firebase Firestore   | Yes          | Firebase project |

Without Firebase configured, the system automatically falls back to local-only
storage.

---

## Firebase Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter a project name (e.g., "phoenixrooivalk-docs")
4. Disable Google Analytics (optional for this use case)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable the providers you want:
   - **Google** - Recommended, easy setup
   - **GitHub** - Good for developers
3. Configure OAuth redirect domains if needed

### 3. Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Choose **Start in production mode**
3. Select a region closest to your users
4. Click "Enable"

### 4. Configure Security Rules

In Firestore, go to **Rules** and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User progress - users can only read/write their own data
    match /userProgress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Get Configuration Values

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the web app icon (`</>`) to add a web app
4. Copy the configuration values

---

## Environment Variables

Set these environment variables in your deployment:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Netlify Setup

1. Go to **Site settings** > **Environment variables**
2. Add each variable above
3. Redeploy your site

### Local Development

Create a `.env.local` file (not committed to git):

```bash
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## Data Structure

User progress is stored in Firestore with this structure:

```typescript
// Collection: userProgress
// Document ID: Firebase Auth UID

{
  docs: {
    "executive/executive-summary": {
      completed: true,
      completedAt: "2025-11-26T10:30:00Z",
      scrollProgress: 100
    },
    // ... more docs
  },
  achievements: {
    "first-read": {
      unlockedAt: "2025-11-26T10:30:00Z"
    },
    // ... more achievements
  },
  stats: {
    totalPoints: 150,
    level: 2,
    streak: 3,
    lastVisit: "2025-11-26T10:30:00Z"
  },
  updatedAt: Timestamp
}
```

---

## Privacy Considerations

- User data is isolated by Firebase Auth UID
- No personal information beyond email is stored
- Users can delete their account via Firebase Console
- Progress data is minimal (doc IDs and timestamps)

---

## Troubleshooting

### "Cloud sync not available"

- Check that all environment variables are set
- Verify Firebase project is created and configured
- Check browser console for Firebase errors

### Authentication fails

- Ensure OAuth providers are enabled in Firebase
- Check that your domain is authorized in Firebase Console
- Verify OAuth credentials if using GitHub

### Data not syncing

- Check Firestore rules allow read/write
- Verify user is authenticated (check browser console)
- Look for Firestore quota errors

---

## Cost Considerations

Firebase free tier includes:

| Resource          | Free Limit      |
| ----------------- | --------------- |
| Authentication    | Unlimited users |
| Firestore reads   | 50,000/day      |
| Firestore writes  | 20,000/day      |
| Firestore storage | 1 GB            |

For a documentation site, this is typically more than sufficient.

---

## Disabling Cloud Sync

To run in local-only mode, simply don't set the Firebase environment variables.
The system will automatically use localStorage.

---

_For questions about cloud sync setup, please open an issue on
[GitHub](https://github.com/JustAGhosT/PhoenixRooivalk/issues)._
