---
id: cloud-sync-setup
title: Cloud Sync Setup Guide
sidebar_label: Cloud Sync Setup
description: Configure Azure services to enable cross-device progress synchronization
difficulty: beginner
estimated_reading_time: 3
points: 10
---

# Cloud Sync Setup Guide

Enable cross-device synchronization for your reading progress and achievements
by configuring Azure services.

---

## Overview

The gamification system supports two modes:

| Mode      | Storage              | Cross-Device | Setup Required      |
| --------- | -------------------- | ------------ | ------------------- |
| **Local** | Browser localStorage | No           | None                |
| **Cloud** | Azure Cosmos DB      | Yes          | Azure configuration |

Without Azure configured, the system automatically falls back to local-only
storage.

---

## Azure Setup Steps

### 1. Create Azure Resources

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new Resource Group for your project
3. You'll need to set up these services:
   - Azure Entra ID (for authentication)
   - Azure Cosmos DB (for data storage)
   - Azure Functions (optional, for AI features)

### 2. Set Up Azure Entra ID

1. Go to **Azure Active Directory** > **App registrations**
2. Click **New registration**
3. Enter your application name
4. Set redirect URIs for your domain(s)
5. Note the **Application (client) ID** and **Directory (tenant) ID**

### 3. Configure Authentication Providers

For social logins (Google, GitHub), set up Azure AD B2C:

1. Create an Azure AD B2C tenant
2. Add identity providers:
   - **Google** - Add OAuth credentials from Google Cloud Console
   - **GitHub** - Add OAuth credentials from GitHub Developer Settings
3. Create user flows for sign-up and sign-in

### 4. Create Cosmos DB Database

1. Go to **Azure Cosmos DB** > **Create account**
2. Choose **Azure Cosmos DB for NoSQL**
3. Select a region closest to your users
4. Create a database and containers:
   - `users` - User profiles and progress
   - `comments` - Comment system data

---

## Environment Variables

Set these environment variables in your deployment:

```bash
# Azure Configuration
AZURE_ENTRA_CLIENT_ID=your-client-id
AZURE_ENTRA_TENANT_ID=your-tenant-id
AZURE_FUNCTIONS_BASE_URL=https://your-functions.azurewebsites.net
```

### Azure Static Web Apps Setup

1. Configure environment variables in Azure Portal
2. Or use `staticwebapp.config.json` for configuration
3. Redeploy your site

### Netlify Setup

1. Go to **Site settings** > **Environment variables**
2. Add each variable above
3. Redeploy your site

### Local Development

Create a `.env.local` file (not committed to git):

```bash
AZURE_ENTRA_CLIENT_ID=your-client-id
AZURE_ENTRA_TENANT_ID=your-tenant-id
AZURE_FUNCTIONS_BASE_URL=http://localhost:7071
```

---

## Data Structure

User progress is stored in Cosmos DB with this structure:

```typescript
// Container: users
// Document ID: Azure Entra user ID

{
  "id": "user-azure-id",
  "docs": {
    "executive/executive-summary": {
      "completed": true,
      "completedAt": "2025-11-26T10:30:00Z",
      "scrollProgress": 100
    }
    // ... more docs
  },
  "achievements": {
    "first-read": {
      "unlockedAt": "2025-11-26T10:30:00Z"
    }
    // ... more achievements
  },
  "stats": {
    "totalPoints": 150,
    "level": 2,
    "streak": 3,
    "lastVisit": "2025-11-26T10:30:00Z"
  },
  "_updatedAt": "2025-11-26T10:30:00Z"
}
```

---

## Privacy Considerations

- User data is isolated by Azure Entra user ID
- No personal information beyond email is stored
- Users can request data deletion
- Progress data is minimal (doc IDs and timestamps)

---

## Troubleshooting

### "Cloud sync not available"

- Check that all environment variables are set
- Verify Azure resources are created and configured
- Check browser console for authentication errors

### Authentication fails

- Ensure redirect URIs are correctly configured
- Check that your domain is authorized in Azure Entra ID
- Verify OAuth credentials for social providers

### Data not syncing

- Check Cosmos DB is accessible
- Verify user is authenticated (check browser console)
- Look for Azure Functions errors in Application Insights

---

## Cost Considerations

Azure offers free tiers:

| Resource          | Free Limit           |
| ----------------- | -------------------- |
| Azure Entra ID    | 50,000 MAU (B2C)     |
| Cosmos DB         | 1000 RU/s, 25 GB     |
| Functions         | 1M executions/month  |

For a documentation site, this is typically more than sufficient.

---

## Disabling Cloud Sync

To run in local-only mode, simply don't set the Azure environment variables.
The system will automatically use localStorage.

---

_For questions about cloud sync setup, please open an issue on
[GitHub](https://github.com/JustAGhosT/PhoenixRooivalk/issues)._
