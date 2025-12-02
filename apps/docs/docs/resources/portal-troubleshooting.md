---
sidebar_position: 8
title: Portal Troubleshooting
description: Troubleshooting guide for the Phoenix Rooivalk documentation portal
---

# Documentation Portal Troubleshooting

This guide helps you resolve common issues with the Phoenix Rooivalk documentation portal, particularly around user profiles and onboarding.

## Common Issues

### Onboarding Issues

#### Skip Button Not Appearing

**Symptom**: You're stuck on the profile completion or profile selection step with no way to skip.

**Solution**: The skip button should now always be visible on the profile completion step. If you still don't see it:

1. Refresh the page (F5 or Ctrl+R)
2. If the issue persists, clear your browser cache and localStorage (see below)

#### Profile Not Being Assigned

**Symptom**: You enter your name (e.g., "Jurie") during signup but your internal profile is not automatically assigned.

**Solution**: As of the latest update, the system now checks your entered name against known internal profiles:

1. Complete the profile form with your first and last name
2. The system will automatically detect if you're a known team member
3. Your profile will be assigned automatically

If this doesn't work:

1. Check that you're entering your name exactly as it appears in the system (case-insensitive)
2. Clear your localStorage data (see below)
3. Log out and log back in

#### Stuck in Onboarding Loop

**Symptom**: You keep being shown the onboarding flow even though you've completed it.

**Solution**: This is often caused by corrupted localStorage data. The portal now automatically detects and fixes this on load. If you're still experiencing issues:

1. Manually clear onboarding data (see below)
2. Refresh the page
3. Complete the onboarding flow again

## Clearing Browser Data

### Method 1: Developer Console (Recommended)

Open the browser developer console (F12 or right-click → Inspect → Console tab) and run:

```javascript
// Clear only onboarding data
localStorage.removeItem("phoenix-docs-onboarding-completed");
localStorage.removeItem("phoenix-docs-onboarding-step");
localStorage.removeItem("phoenix-docs-profile-confirmed");
localStorage.removeItem("phoenix-docs-user-profile");
localStorage.removeItem("phoenix-docs-profile-pending");
localStorage.removeItem("phoenix-docs-user-details");
localStorage.removeItem("phoenix-docs-user-fun-facts");
console.log("Onboarding data cleared. Refresh the page.");
```

Then refresh the page (F5 or Ctrl+R).

### Method 2: Clear All Site Data

**Warning**: This will reset ALL your preferences and progress on the documentation site.

1. Open browser developer console (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Find "Local Storage" in the left sidebar
4. Right-click on the site URL
5. Select "Clear"
6. Refresh the page

### Method 3: Browser Settings

**Chrome/Edge:**
1. Click the lock icon in the address bar
2. Click "Site settings"
3. Scroll down to "Clear data"
4. Click "Clear data"
5. Refresh the page

**Firefox:**
1. Click the lock icon in the address bar
2. Click "Clear cookies and site data"
3. Confirm
4. Refresh the page

## Known Internal Users

The system automatically recognizes the following team members:

- **Martyn**: Business, Marketing, Technical-Mechanical
- **Pieter**: Technical-Mechanical
- **Jurie**: Founder, Lead, Technical-Software/AI
- **Chanelle**: Marketing, Sales
- **Eben**: Financial, Business, Executive, Technical-Software/AI

If you're one of these users:
1. Make sure your authentication email or display name contains your name
2. OR enter your first name during profile completion
3. The system will automatically assign your profile

## Still Having Issues?

If you continue to experience problems:

1. Try using a different browser or incognito/private mode
2. Check that JavaScript is enabled
3. Clear your browser cache completely
4. Contact the team at [support@phoenixrooivalk.com](mailto:support@phoenixrooivalk.com)

## Technical Details

### localStorage Keys Used

The documentation portal uses the following localStorage keys:

- `phoenix-docs-onboarding-completed`: Tracks if you've completed onboarding
- `phoenix-docs-onboarding-step`: Your current step in the onboarding flow
- `phoenix-docs-profile-confirmed`: Whether you've confirmed your profile
- `phoenix-docs-user-profile`: Your saved profile data
- `phoenix-docs-profile-pending`: Temporary state during profile confirmation
- `phoenix-docs-user-details`: Your entered profile details (name, LinkedIn, etc.)
- `phoenix-docs-user-fun-facts`: AI-generated fun facts about you

### Automatic Corruption Detection

The portal automatically detects and fixes corrupted onboarding data when:

- Profile is marked as confirmed but no profile data exists
- Onboarding is marked as completed but no profile confirmation exists
- localStorage data contains malformed JSON

When corruption is detected, the system automatically clears the corrupted data and allows you to restart the onboarding process.

## Recent Updates

### December 2024

- **Skip button visibility**: Fixed issue where skip button wasn't appearing during profile completion
- **Internal profile detection**: Improved automatic profile assignment for known team members based on entered name
- **Automatic corruption detection**: Added automatic detection and fixing of corrupted localStorage state
- **localStorage utilities**: Added comprehensive utilities for managing and diagnosing onboarding data

---

*Last updated: December 2024*
